/**
 * Model class. Knows everything about API endpoint and data structure. Can format/map data to any structure.
 *
 * @constructor
 */

function Model() {
  const _apiUrl = "http://localhost:3000/api/";

  /**
   * URL template for getting the stores from server.
   * @type {string}
   *
   * @private
   */
  const _storesURLTemplate = `${_apiUrl}Stores`;

  /**
   * URL template for getting the territories of a certain employee from OData service.
   * @type {string}
   *
   * @example _allStoreProductsURLTemplate.replace("{STORE_ID}", storeId);
   *
   * @private
   */
  const _allStoreProductsURLTemplate = `${_apiUrl}Stores/{STORE_ID}/rel_Products`;

  /**
   * URL template for getting some of the store's products from server.
   * @type {string}
   *
   * @private
   */
  const _productsURLTemplate = `${_apiUrl}Products`;

  /**
   * The link to the currently selected store object.
   * @type {object}
   *
   * @private
   */
  let _currentStoreData = null;

  /**
   * The link to object with information about filtering.
   * @type {object}
   *
   * @private
   */
  let filterCounter = {
    parameterName: "",
    clickCount: 0,
  };

  /**
   * The link to object with information products statuses.
   * @type {object}
   *
   * @private
   */
  const statuses = {
    Ok: "OK",
    Storage: "STORAGE",
    "Out of stock": "OUT_OF_STOCK",
  };

  /**
   * The link to object with information products parameters.
   * @type {object}
   *
   * @private
   */
  const productParameters = {
    Name: "Name",
    Price: "Price",
    Specs: "Specs",
    SupplerInfo: "SupplerInfo",
    "Country of origin": "MadeIn",
    "Prod. company": "ProductionCompanyName",
    Rating: "Rating",
  };

  /**
   * Common method which "promisifies" the XHR calls.
   *
   * @param {string} method the method of sending request.
   *
   * @param {string} url the URL address to fetch.
   *
   * @param {object} body the body of the request sent to the server.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.sendRequest = function (method, url, body = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);

      xhr.responseType = "json";
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        if (xhr.status >= 400) {
          reject(xhr.response);
        } else {
          resolve(xhr.response);
        }
      };
      xhr.onerror = () => {
        reject(xhr.response);
      };
      if (method === "POST" || method === "PUT") {
        xhr.send(JSON.stringify(body));
      } else {
        xhr.send();
      }
    });
  };

  /**
   * Fetch the all stores list.
   *
   * @returns {Promise} the promise object will be resolved once the stores object gets loaded.
   *
   * @public
   */
  this.getAllStoresData = function () {
    return this.sendRequest("GET", _storesURLTemplate).then(function (
      storesData
    ) {
      return storesData;
    });
  };

  /**
   * Fetch the checked store details.
   *
   * @param {string} storeName the name of the selected store.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.getStoreDetails = function (storeName) {
    return this.sendRequest(
      "GET",
      `${_storesURLTemplate}/?filter={"where":{"Name":"${storeName}"}}`
    ).then(function (storeData) {
      _currentStoreData = storeData[0];
      return storeData;
    });
  };

  /**
   * Fetch the checked store products.
   *
   * @param {string} storeName the name of the selected store.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.getStoreProducts = function () {
    return this.sendRequest(
      "GET",
      _allStoreProductsURLTemplate.replace("{STORE_ID}", _currentStoreData.id)
    ).then((storeProducts) => {
      return storeProducts;
    });
  };

  /**
   * Fetch the products with the same statuses.
   *
   * @param {string} statusValue the name of the selected status.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.getProductsWithSameStatus = function (statusValue) {
    return this.sendRequest(
      "GET",
      `${_allStoreProductsURLTemplate.replace(
        "{STORE_ID}",
        _currentStoreData.id
      )}?filter={"where":{"Status":"${statuses[statusValue]}"}}`
    ).then((products) => {
      return products;
    });
  };

  /**
   * Fetch the products with the same search value.
   *
   * @param {string} value the search value.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.getSearchedProducts = function (value) {
    return this.sendRequest(
      "GET",
      `${_allStoreProductsURLTemplate.replace(
        "{STORE_ID}",
        _currentStoreData.id
      )}?filter={"where":{
        "and":[
          {
            "or":[
              {"Name":{"regexp":"/${value}/i"}},
              {"Specs":{"regexp":"/${value}/i"}},
              {"SupplierInfo":{"regexp":"/${value}/i"}},
              {"MadeIn":{"regexp":"/${value}/i"}},
              {"ProductionCompanyName":{"regexp":"/${value}/i"}},
              {"Price":{"like":"${value}"}}]},
              {"StoreId":"${_currentStoreData.id}"}
            ]
          }
        }`
    ).then((products) => {
      currentProductsData = products;

      return products;
    });
  };

  /**
   * Put new product to the server.
   *
   * @param {object} newStoreData data for registering a new store.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.setNewStore = function (newStoreData) {
    return this.sendRequest("POST", _storesURLTemplate, newStoreData);
  };

  /**
   * load products sorted by parameter.
   *
   * @param {string} parameter the name of sorting parameter.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.getSortedProducts = function (parameter) {
    const paramToSort = productParameters[`${parameter}`];
    if (filterCounter.parameterName !== parameter) {
      filterCounter.parameterName = parameter;
      filterCounter.clickCount = 1;
    } else {
      filterCounter.clickCount += 1;
    }
    if (filterCounter.clickCount === 1) {
      return this.sendRequest(
        "GET",
        `${_allStoreProductsURLTemplate.replace(
          "{STORE_ID}",
          _currentStoreData.id
        )}?filter[order]=${paramToSort} ASC`
      ).then((response) => {
        return response;
      });
    } else if (filterCounter.clickCount === 2) {
      return this.sendRequest(
        "GET",
        `${_allStoreProductsURLTemplate.replace(
          "{STORE_ID}",
          _currentStoreData.id
        )}?filter[order]=${paramToSort} DESC`
      ).then((response) => {
        return response;
      });
    } else {
      return this.sendRequest(
        "GET",
        `${_allStoreProductsURLTemplate.replace(
          "{STORE_ID}",
          _currentStoreData.id
        )}`
      ).then((response) => {
        filterCounter.clickCount = 0;
        return response;
      });
    }
  };

  /**
   * Delete a store with its products.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.deleteStore = function () {
    return this.sendRequest(
      "DELETE",
      _allStoreProductsURLTemplate.replace("{STORE_ID}", _currentStoreData.id)
    ).then((res) => {
      this.sendRequest(
        "DELETE",
        `${_storesURLTemplate}/${_currentStoreData.id}`
      );
    });
  };

  /**
   * Add a new product to the server.
   *
   * @param {object} newProductData product data to create.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.setNewProduct = function (newProductData) {
    newProductData.StoreId = _currentStoreData.id;
    return this.sendRequest("POST", _productsURLTemplate, newProductData);
  };

  /**
   * Redact the product.
   *
   * @param {object} newProductData product data to redact.
   *
   * @param {string} productId product id to redact.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.setRedactedProduct = function (newProductData, productId) {
    newProductData.id = Number(productId);
    newProductData.StoreId = Number(_currentStoreData.id);
    return this.sendRequest(
      "PUT",
      `${_productsURLTemplate}/${productId}`,
      newProductData
    ).then((res) => {
      return res;
    });
  };

  /**
   * Delete the product.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @public
   */
  this.deleteProduct = function (productId) {
    return this.sendRequest(
      "DELETE",
      `${_productsURLTemplate}/${productId}`
    ).then((res) => {
      return res;
    });
  };

  /**
   * Load product by its ID.
   *
   * @return {Promise} the promise object will be resolved once XHR gets loaded/failed.
   *
   * @param {string} productId product id.
   *
   *
   * @public
   */
  this.getProduct = function (productId) {
    return this.sendRequest("GET", `${_productsURLTemplate}/${productId}`).then(
      (product) => {
        return product;
      }
    );
  };

  /**
   * Load product by its ID.
   *
   * @return {object} the object with error status information.
   *
   * @param {object} productId object with information from form.
   *
   *
   * @public
   */
  this.formValidation = function (obj) {
    let objToRet = {};
    for (key in obj) {
      if (!obj[key]) {
        objToRet[key] = "";
      } else {
        if (key === "PhoneNumber" || key === "Price" || key === "Rating") {
          const reg = new RegExp("^\\d+$");
          reg.test(obj[key]) ? (objToRet[key] = key) : (objToRet[key] = "");
        } else if (key === "Email") {
          const reg = new RegExp(/^([\w.*-]+@([\w-]+\.)+[\w-]{2,4})?$/);
          reg.test(obj[key]) ? (objToRet[key] = key) : (objToRet[key] = "");
        } else {
          objToRet[key] = key;
        }
      }
    }
    return objToRet;
  };
}

/**
 * View class. Knows everything about dom & manipulation and a little bit about data structure, which should be
 * filled into UI element.
 *
 * @constructor
 */
function View() {
  /**
   * Returns the stores list.
   *
   * @returns {HTMLUListElement} the unordered list element.
   */
  this.getStoresList = function () {
    return document.querySelector(".show-stores");
  };

  /**
   * Returns the stores search button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getSearchStore = function () {
    return document.querySelector(".search__btn-loupe");
  };

  /**
   * Returns the stores search input.
   *
   * @returns {string} search store input content.
   */
  this.getSearchStoresValue = function () {
    return document.querySelector("#search_stores").value;
  };

  /**
   * Returns the store search reset button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getRefreshSearchStore = function () {
    return document.querySelector(".search__btn-reset");
  };

  /**
   * Returns the store details info div.
   *
   * @returns {HTMLDivElement} the div element.
   */
  this.getStoreDetails = function () {
    return document.querySelector(".store_info");
  };

  /**
   * Returns the store filters div.
   *
   * @returns {HTMLDivElement} the div element.
   */
  this.getStoreFilters = function () {
    return document.querySelector(".store__filters");
  };

  this.getStatusValue = function (event) {
    return event.target.closest(".store__filter_mg").lastChild.textContent;
  };

  /**
   * Returns the store filters container.
   *
   * @returns {HTMLDivElement} the div element.
   */
  this.getProductFilter = function () {
    return document.querySelector(".store__filter");
  };

  /**
   * Returns the store filter all button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getStoreFilterAll = function () {
    return document.querySelector(".store__filter--all");
  };

  /**
   * Returns products table header.
   *
   * @returns {HTMLTableCaptionElement} the table caption element.
   */
  this.getProductsTableHeader = function () {
    return document.querySelector(".products__header_main");
  };

  /**
   * Returns products search input value.
   *
   * @returns {string} the products search input content.
   */
  this.getProductsSearchValue = function () {
    return document.querySelector("#product_search_field").value;
  };
  this.getProductsSearchValueReset = function () {
    document.querySelector("#product_search_field").value = "";
  };

  /**
   * Returns products search button.
   *
   * @returns {HTMLButtonElement} the products search button.
   */
  this.getProductsSearchButton = function () {
    return document.querySelector("#product_search_btn");
  };

  /**
   * Returns products reset search button.
   *
   * @returns {HTMLButtonElement} the products reset search button.
   */
  this.getProductsResetButton = function () {
    return document.querySelector("#product_search_reset");
  };

  /**
   * Returns products table body.
   *
   * @returns {HTMLTableElement} the table element.
   */
  this.getTable = function () {
    return document.querySelector("#products__table");
  };

  /**
   * Returns products thead.
   *
   * @returns {HTMLTableRowElement} the table row element.
   */
  this.getProductsHeader = function () {
    return document.querySelector("#sorting");
  };

  /**
   * Returns products sorting cell.
   *
   * @returns {HTMLTableDataCellElement} the table cell element.
   */
  this.getColumnSort = function () {
    return document.querySelector(".column__sort");
  };

  /**
   * Returns products sorting parameter.
   *
   * @returns {string} the sorting parameter value.
   */
  this.getSortParameter = function (event) {
    return event.target.closest(".text_dec").textContent;
  };

  /**
   * Returns footer create store button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getCreateStoreBtn = function () {
    return document.querySelector("#create_store_btn");
  };

  /**
   * Returns form create store button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getCreateStore = function () {
    return document.querySelector("#create_store");
  };

  /**
   * Returns footer delete store button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getDeleteStoreBtn = function () {
    return document.querySelector(".footer_btn_delete");
  };

  /**
   * Returns confirm modal delete store button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getModalDeleteStoreConfirm = function () {
    return document.querySelector("#delete_store");
  };

  /**
   * Returns footer create product button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getCreateProductBtn = function () {
    return document.querySelector("#create_product_btn");
  };

  /**
   * Returns form create product button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getCreateProduct = function () {
    return document.querySelector("#create_product");
  };

  /**
   * Returns table redact product button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getRedactProduct = function () {
    return document.querySelector("#redact_product");
  };

  /**
   * Returns table delete product button.
   *
   * @returns {HTMLButtonElement} the button element.
   */
  this.getModalDeleteProductConfirm = function () {
    return document.querySelector("#delete_product");
  };

  /**
   * Add the stores into stores list block.
   *
   * @param {Array} storesData the array of stores.
   *
   * @public
   */
  this.renderStores = function (storesData) {
    this.getStoresList().innerHTML = "";
    storesData.forEach((element) => {
      this.getStoresList().innerHTML += `<li class="stores__item">
      <div class="stores__item--info">
        <h4>${element.Name}</h4>
        <div>
          <h2>${element.FloorArea}</h2>
          <span>sq.m</span>
        </div>
      </div>
  
      <p class="stores__item_address">
      ${element.Address}
      </p>
    </li>`;
    });

    /**
     * Add the store details into store details block.
     *
     * @param {Array} storesData the array of the checked store.
     *
     * @public
     */
    this.renderStoreDetails = function (storeData) {
      this.getStoreDetails().innerHTML = "";
      this.getStoreDetails().innerHTML += ` 
      <div class="store__details--info">
        <ul class="store__details--info_col store__details--info_font-s-13">
          <li><b >Email:</b>
            <span id="email">${storeData[0].Email}</span> 
          </li>
          <li>
            <b>Phone Number:</b>
            ${storeData[0].PhoneNumber}
          </li>
          <li>
             <b>Address:</b>
             ${storeData[0].Address}
           </li>
           <li>
             <b>Established Date:</b>
             ${new Date(Date.parse(storeData[0].Established)).toDateString()}
           </li>
           <li>
            <b>Floor Area:</b>
             ${storeData[0].FloorArea}
              
          </li>
        </ul>
      </div>
      <div class="just_unused">
         <img
          class="unused_btn"
          src="/img/arrow-down-sign-to-navigate.svg"
           alt=""
         />
        <img class="unused_btn" src="/img/clip.svg" alt="" />
      </div>`;
    };
  };

  /**
   * Add the store filters into store filters block.
   *
   * @param {Array} storesData the array of the checked store.
   *
   * @param {object} currentStore the object with current store info.
   *
   * @public
   */
  this.renderStoreFilter = function (currentStore, getStatusValue) {
    this.getStoreFilters().innerHTML = "";
    this.getStoreFilters().innerHTML += `
      <div class="store__filter--all">
        ${currentStore}
        <span class="font-size-11 margin-left-5">All</span>
      </div>
      <div class="store__filter">
        <div class="store__filter_mg ">
          <div class="store__filter_brdr  store__filter_brdr-green">
            <img  class="filter" src="img/check-button.svg" alt="" />
          </div>
          <span class="store__filter_amount">${getStatusValue.ok}</span>
            <span class="font-size-11 status">Ok</span></div>
  
        <div class="store__filter_mg ">
          <div class="store__filter_brdr store__filter_brdr-orange">
            <img class="filter" src="img/warning.svg" alt="" />
          </div>
          <span class="store__filter_amount">${getStatusValue.storage}</span>
            <span class="font-size-11 status">Storage</span></div>
  
        <div class="store__filter_mg ">
          <div class="store__filter_brdr store__filter_brdr-red">
            <img class="filter"  src="img/exclamation-button.svg" alt="" />
          </div>
          <span class="store__filter_amount">${getStatusValue.outOfStock}</span>
            <span class="font-size-11 status">Out of stock</span></div>
      </div>`;
  };

  /**
   * Add warnings to incorrectly filled fields.
   *
   * @param {object} data the object with information about filling .
   *
   * @param {HTMLFormElement} form the form element.
   *
   * @public
   */
  this.renderErrors = function (data, form) {
    for (key in data) {
      if (!data[key]) {
        form.querySelector(`.${key}`).dataset.error = `${key} is not correct`;
        form.querySelector(`.${key}`).classList.add("from_input_validation");
      } else {
        form.querySelector(`.${key}`).classList.remove("from_input_validation");
      }
    }
  };

  /**
   * Add products to the product block
   *
   * @param {Array} storesData the array of the checked store.
   *
   * @public
   */
  this.renderProducts = function (storeData) {
    this.getTable().innerHTML = "";
    storeData.forEach((element) => {
      this.getTable().innerHTML += `<tr class="store__description"><td class="text_dec"><span class="text_dec"><b>${
        element.Name
      }</b><br/><br/></span><span>${element.id}</span></td>
      <td class="text_dec">
        <span class="text_dec"><b>${element.Price}</b> USD</span>
      </td>
      <td class="text_dec">
        <p class="text_dec hidden-text" title="${element.Specs}"
        >
        ${element.Specs}
        </p>
      </td>
      <td class="text_dec">
        <p class="text_dec power hidden-text" title="${element.SupplierInfo}">
        ${element.SupplierInfo}
        </p>
      </td>
      <td class="text_dec"> ${element.MadeIn}</td>
      <td class="text_dec">
        <p class="text_dec hidden-text" title="${
          element.ProductionCompanyName
        }">
        ${element.ProductionCompanyName}
        </p>
      </td>
      <td class="text_dec">
        <div class="rating-mini rating-mini_none">
          ${this._renderStars(element.Rating)}
        </div>
      </td>
      <td class="text_dec x_mark"><img class="redact_product"src="/img/free-icon-pencil-1166723.svg" alt=""><img class="delete_product_btn" src="/img/free-icon-x-mark-1617543.svg" alt=""></td>
    </tr>`;
    });

    /**
     * Add current product information.
     *
     * @param {object} productData the object with unredacted product data.
     *
     * @public
     */
    this.fillInputsWithProductInfo = function (productData) {
      this.getRedactProduct()
        .querySelectorAll("input")
        .forEach((element) => {
          for (key in productData) {
            if (element.name === key) {
              element.value = `${productData[key]}`;
            }
          }
        });
    };
  };

  /**
   * Add rating stars to each product
   *
   * @param {number} value the product rating value.
   *
   * @private
   */
  this._renderStars = function (value) {
    const arr = [1, 2, 3, 4, 5];
    const stars = arr.map((element, index) => {
      if (index < value) {
        return `<span class="active"></span> `;
      } else {
        return `<span ></span> `;
      }
    });
    return stars;
  };

  /**
   * Return checked store name.
   *
   * @param {object} event object with event information.
   *
   * @returns {string} checked store name.
   *
   * @public
   */
  this.getCheckedStoreName = function (event) {
    const store = event.target.closest(".stores__item");
    checkedStore = store.children[0].children[0].innerHTML;
    document.querySelector(".no-store").style.display = "none";
    return checkedStore;
  };
}

/**
 * Controller class. Orchestrates the model and view objects. A "glue" between them.
 *
 * @param {View} view view instance.
 * @param {Model} model model instance.
 *
 * @constructor
 */
function Controller(view, model) {
  const that = this;
  let productId = null;

  /**
   * Initialize controller.
   *
   * @public
   */
  that.init = function () {
    const storesList = view.getStoresList();
    const searchStore = view.getSearchStore();
    const refreshSearchStore = view.getRefreshSearchStore();
    const storeFilters = view.getStoreFilters();
    const productTableHeader = view.getProductsTableHeader();
    const productsHeader = view.getProductsHeader();
    const createStoreBtn = view.getCreateStoreBtn();
    const createStore = view.getCreateStore();
    const deleteStoreBtn = view.getDeleteStoreBtn();
    const modalDeleteStoreConfirm = view.getModalDeleteStoreConfirm();
    const createProductBtn = view.getCreateProductBtn();
    const createProduct = view.getCreateProduct();
    const table = view.getTable();
    const modalDeleteProductConfirm = view.getModalDeleteProductConfirm();
    const redactProduct = view.getRedactProduct();

    that._onLoadStoresInfo();

    storesList.addEventListener("click", that._onCheckedStore);
    searchStore.addEventListener("click", that._onSearchStore);
    refreshSearchStore.addEventListener("click", that._onLoadStoresInfo);
    storeFilters.addEventListener("click", that._onStoreFilterAll);
    productTableHeader.addEventListener("click", that._onProductsSearch);
    productsHeader.addEventListener("click", that._onProductSort);
    createStoreBtn.addEventListener("click", that._onCreateStoreBtn);
    createStore.addEventListener("click", that._onCreateStore);
    deleteStoreBtn.addEventListener("click", that._onDeleteStoreBtn);
    modalDeleteStoreConfirm.addEventListener("click", that._onModalDeleteStore);
    createProductBtn.addEventListener("click", that._onCreateProductBtn);
    createProduct.addEventListener("click", that._onCreateProduct);
    redactProduct.addEventListener("click", that._onRedactProduct);
    table.addEventListener("click", that._onProductActions);
    modalDeleteProductConfirm.addEventListener(
      "click",
      that._onModalDeleteProductConfirm
    );
  };

  /**
   * Load stores list.
   *
   * @private
   */
  that._onLoadStoresInfo = function () {
    model.getAllStoresData().then((storesData) => {
      view.renderStores(storesData);
    });
  };

  /**
   * Load store details ul click event handler.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onCheckedStore = function (event) {
    const checkedStoreName = view.getCheckedStoreName(event);
    model.getStoreDetails(checkedStoreName).then((storeData) => {
      view.renderStoreDetails(storeData);
      that.showStoreProducts();
    });
  };

  /**
   * Load products information.
   *
   * @private
   */
  that.showStoreProducts = function () {
    model.getStoreProducts().then((storeProducts) => {
      const value = that._getStatusValue(storeProducts);
      view.renderStoreFilter(storeProducts.length, value);
      view.renderProducts(storeProducts);
    });
  };

  /**
   * Loads stores matching search .
   *
   * @private
   */
  that._onSearchStore = function () {
    model.getAllStoresData().then((storesData) => {
      const selectedStores = that._findStrInObj(
        view.getSearchStoresValue(),
        storesData
      );
      view.renderStores(selectedStores);
    });
  };

  /**
   * Loads products with matching status .
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onStoreFilterAll = function (event) {
    if (event.target.matches(".filter")) {
      model
        .getProductsWithSameStatus(view.getStatusValue(event))
        .then((products) => {
          model.getStoreProducts().then((response) => {
            const value = that._getStatusValue(products);
            view.renderStoreFilter(response.length, value);
            view.renderProducts(products);
          });
        });
    }
    that.showStoreProducts();
  };

  /**
   * Loads products matching search .
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onProductsSearch = function (event) {
    if (event.target === view.getProductsSearchButton()) {
      model
        .getSearchedProducts(view.getProductsSearchValue())
        .then((products) => {
          const value = that._getStatusValue(products);
          view.renderStoreFilter(products.length, value);
          view.renderProducts(products);
        });
    } else if (event.target === view.getProductsResetButton()) {
      view.getProductsSearchValueReset();
      that.showStoreProducts();
    }
  };

  /**
   * Loads sorted products.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onProductSort = function (event) {
    if (event.target.matches(".column__sort")) {
      model.getSortedProducts(view.getSortParameter(event)).then((products) => {
        view.renderProducts(products);
        event.target.classList.toggle("column__sort_active");
      });
    }
  };

  /**
   * Loads a modal window with a form for creating a store.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onCreateStoreBtn = function (event) {
    view.getCreateStore().closest(".modal").classList.toggle("display_none");
  };

  /**
   * Uploads the store to the server and adds it to the list of stores.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onCreateStore = function (event) {
    if (event.target.matches("#cancel_form_store")) {
      event.target.closest(".modal").classList.toggle("display_none");
      view.getCreateStore().reset();
    } else if (event.target.matches("#submit_create-store")) {
      const formData = new FormData(view.getCreateStore());
      const json = Object.fromEntries(formData);
      const validatedFormData = model.formValidation(json);
      view.renderErrors(validatedFormData, view.getCreateStore());
      if (!document.querySelectorAll(".from_input_validation").length) {
        model.setNewStore(json).then((response) => {
          that._onLoadStoresInfo();
          view
            .getCreateStore()
            .closest(".modal")
            .classList.toggle("display_none");
          view.getCreateStore().reset();
          event.preventDefault();
        });
      }
    }
  };

  /**
   * Load the confirmation window for deleting the store.
   *
   * @private
   */
  that._onDeleteStoreBtn = function () {
    view.getModalDeleteStoreConfirm().classList.toggle("display_none");
  };

  /**
   * Delete the store from the server and delete it from the list of stores.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onModalDeleteStore = function (event) {
    if (event.target.matches("#confirm_delete")) {
      model.deleteStore().then(() => that._onLoadStoresInfo());
      view.getModalDeleteStoreConfirm().classList.toggle("display_none");
      document.querySelector(".no-store").style.display = "flex";
    } else {
      view.getModalDeleteStoreConfirm().classList.toggle("display_none");
    }
  };

  /**
   * Uploads the product to the server and adds it to the products table.
   *
   * @private
   */
  that._onCreateProductBtn = function () {
    view.getCreateProduct().closest(".modal").classList.toggle("display_none");
  };

  /**
   * Delete the product from the server and delete it from the products table.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onCreateProduct = function (event) {
    if (event.target.matches("#cancel_form_product")) {
      view
        .getCreateProduct()
        .closest(".modal")
        .classList.toggle("display_none");
      view.getCreateProduct().reset();
    } else if (event.target.matches("#submit_create-product")) {
      const formData = new FormData(view.getCreateProduct());
      const json = Object.fromEntries(formData);
      const validatedFormData = model.formValidation(json);
      view.renderErrors(validatedFormData, view.getCreateProduct());
      if (!document.querySelectorAll(".from_input_validation").length) {
        model.setNewProduct(json).then((response) => {
          that.showStoreProducts();
          view
            .getCreateProduct()
            .closest(".modal")
            .classList.toggle("display_none");
          view.getCreateProduct().reset();
          event.preventDefault();
        });
      }
    }
  };

  /**
   * Updates product information on the server and in the product list.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onRedactProduct = function (event) {
    if (event.target.matches("#redact_form_product")) {
      view
        .getRedactProduct()
        .closest(".modal")
        .classList.toggle("display_none");
      view.getRedactProduct().reset();
    } else if (event.target.matches("#submit_redact-product")) {
      const formData = new FormData(view.getRedactProduct());
      const json = Object.fromEntries(formData);
      const validatedFormData = model.formValidation(json);
      view.renderErrors(validatedFormData, view.getRedactProduct());
      if (!document.querySelectorAll(".from_input_validation").length) {
        model.setRedactedProduct(json, productId).then((response) => {
          that.showStoreProducts();
          view
            .getRedactProduct()
            .closest(".modal")
            .classList.toggle("display_none");
          view.getRedactProduct().reset();
          event.preventDefault();
        });
      }
    }
  };

  /**
   * Load product deletion or product redacting window.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onProductActions = function (event) {
    if (event.target.matches(".delete_product_btn")) {
      view.getModalDeleteProductConfirm().classList.toggle("display_none");
      productId = event.target.closest(".store__description").firstChild
        .lastChild.textContent;
    } else if (event.target.matches(".redact_product")) {
      productId = event.target.closest(".store__description").firstChild
        .lastChild.textContent;
      view
        .getRedactProduct()
        .closest(".modal")
        .classList.toggle("display_none");
    }
    model.getProduct(productId).then((product) => {
      view.fillInputsWithProductInfo(product);
    });
  };

  /**
   * Сonfirms or cancels product removal.
   *
   * @param {Event} event the DOM event object.
   *
   * @private
   */
  that._onModalDeleteProductConfirm = function (event) {
    if (event.target.matches("#confirm_delete")) {
      view.getModalDeleteProductConfirm().classList.toggle("display_none");
      model.deleteProduct(productId).then((response) => {
        that.showStoreProducts();
      });
    } else if (event.target.matches("#reject_delete")) {
      view.getModalDeleteProductConfirm().classList.toggle("display_none");
    }
  };
  /**
   * Return the number of products with a certain status.
   *
   * @param {Array} store all products of the selected store.
   *
   * @returns {object} counted product statuses.
   *
   * @private
   */
  that._getStatusValue = function (store) {
    const statusValues = {
      outOfStock: 0,
      ok: 0,
      storage: 0,
    };
    store.forEach((element) => {
      if (element.Status === "OUT_OF_STOCK") {
        statusValues.outOfStock += 1;
      } else if (element.Status === "OK") {
        statusValues.ok += 1;
      } else {
        statusValues.storage += 1;
      }
    });
    return statusValues;
  };

  /**
   * Сonfirms or cancels product removal.
   *
   * @param {string} str values ​​to find matches.
   *
   * @param {Array} arr an array of objects to search for.
   *
   * @returns {Array} filtered array.
   *
   * @private
   */
  that._findStrInObj = function (str, arr) {
    const regex = new RegExp(str, "i");

    return arr.filter((element) =>
      Object.keys(element).some((key) => regex.test(element[key]))
    );
  };
}

new Controller(new View(), new Model()).init();
