"use strict";

const apiUrl = "http://localhost:3000/api/";
const storesApiUrl = `${apiUrl}Stores`;
const productsApiUrl = `${apiUrl}Products`;

const storesList = document.querySelector(".show-stores");
const searchStore = document.querySelector(".search__btn-loupe");
const searchStoresValue = document.querySelector("#search_stores");
const refreshSearchStore = document.querySelector(".search__btn-reset");

const storeDetails = document.querySelector(".store_info");
const storeFilters = document.querySelector(".store__filters");
const productFilter = document.querySelector(".store__filter");
const table = document.querySelector("#products__table");

const createStoreBtn = document.querySelector("#create_store_btn");
const createStore = document.querySelector("#create_store");
const createProductBtn = document.querySelector("#create_product_btn");
const createProduct = document.querySelector("#create_product");

const modalDeleteStoreConfirm = document.querySelector("#delete_store");
const modalDeleteProductConfirm = document.querySelector("#delete_product");
const deleteStoreBtn = document.querySelector(".footer_btn_delete");

// State data
const currentStore = [];
let storeId = null;
let productId = null;
let allProducts = null;
let checkedStore = "";

const productParameters = {
  Name: "Name",
  Price: "Price",
  Specs: "Specs",
  SupplerInfo: "SupplerInfo",
  "Country of origin": "MadeIn",
  "Prod. company": "ProductionCompanyName",
  Rating: "Rating",
};

let filterCounter = {
  parameterName: "",
  clickCount: 0,
};

renderAllStores(storesApiUrl);
// Events

refreshSearchStore.addEventListener("click", (event) => {
  searchStoresValue.value = "";
  renderAllStores(storesApiUrl);
});

searchStore.addEventListener("click", (event) => {
  const searchValue = searchStoresValue.value;
  sendRequest("GET", `${storesApiUrl}`).then((response) => {
    console.log(response);
    renderStores(findStrInObj(searchValue, response));
  });
});

storesList.addEventListener("click", (event) => {
  const store = event.target.closest(".stores__item");
  checkedStore = store.children[0].children[0].innerHTML;
  document.querySelector(".no-store").style.display = "none";
  renderStoreDetails(checkedStore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("#product_search_btn")) {
    const searchValue = document.querySelector("#product_search_field").value;
    searchInProducts(searchValue);
  } else if (event.target.matches("#product_search_reset")) {
    renderProducts();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.matches(".column__sort")) {
    const sortParam = event.target.closest(".text_dec").textContent;
    console.log(sortParam);
    sortByParameters(sortParam);
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".store__filter--all")) {
    renderProducts();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.matches(".filter")) {
    const statuses = {
      Ok: "OK",
      Storage: "STORAGE",
      "Out of stock": "OUT_OF_STOCK",
    };
    const statusValue = event.target.closest(".store__filter_mg").lastChild
      .textContent;
    console.log(statusValue);
    // const filteredProducts = currentStore.filter(
    //   (element) => element.Status === statuses[statusValue]
    // );
    const regexp = new RegExp(statusValue);
    sendRequest(
      "GET",
      `${storesApiUrl}/${storeId}/rel_Products?filter={"where":{"Status":"${statuses[statusValue]}"}}`
    ).then((response) => {
      getStoreFilter(response);
      getProducts(response);
    });
  }
});

function searchInProducts(str) {
  sendRequest(
    "GET",
    `${storesApiUrl}/${storeId}/rel_Products?filter={"where":{
      "and":[
        {
          "or":[
            {"Name":{"regexp":"/${str}/i"}},
            {"Specs":{"regexp":"/${str}/i"}},
            {"SupplierInfo":{"regexp":"/${str}/i"}},
            {"MadeIn":{"regexp":"/${str}/i"}},
            {"ProductionCompanyName":{"regexp":"/${str}/i"}},
            {"Price":{"like":"${str}"}}]},
            {"StoreId":"${storeId}"}
          ]
        }
      }`
  ).then((response) => {
    getStoreFilter(response);
    getProducts(response);
  });
}

deleteStoreBtn.addEventListener("click", (event) => {
  console.log(event);
  modalDeleteStoreConfirm.classList.toggle("display_none");
});

modalDeleteStoreConfirm.addEventListener("click", (event) => {
  if (event.target.matches("#confirm_delete")) {
    deleteStore();
  } else {
    modalDeleteStoreConfirm.classList.toggle("display_none");
  }
});

function deleteStore() {
  sendRequest("DELETE", `${storesApiUrl}/${storeId}`)
    .then((response) => {
      console.log(response);
      modalDeleteStoreConfirm.classList.toggle("display_none");
    })
    .catch((response) => console.log(response.error.message));
  sendRequest("DELETE", `${storesApiUrl}/${storeId}/rel_Products`)
    .then((response) => {
      console.log(response);
      renderAllStores(storesApiUrl);
    })
    .catch((response) => console.log(response.error.message, response));

  document.querySelector(".no-store").style.display = "flex";
}

createStoreBtn.addEventListener("click", (event) => {
  createStore.closest(".modal").classList.toggle("display_none");
});

createStore.addEventListener("click", (event) => {
  event.preventDefault();
  if (event.target.matches("#cancel_form_store")) {
    createStore.closest(".modal").classList.toggle("display_none");
    createStore.reset();
  } else if (event.target.matches("#submit_create-store")) {
    const FD = new FormData(createStore);
    const json = Object.fromEntries(FD);
    console.log(json);
    sendRequest("POST", `${storesApiUrl}`, json)
      .then((response) => {
        console.log(response);
        createStore.closest(".modal").classList.toggle("display_none");
        renderAllStores(storesApiUrl);
        createStore.reset();
      })
      .catch((response) => {
        console.log(response.error.message);
        document.querySelectorAll(".form_input").forEach((element) => {
          console.log(element);
          element.classList.add("from_input_validation");
        });
      });
  }
});

createProductBtn.addEventListener("click", (event) => {
  createProduct.closest(".modal").classList.toggle("display_none");
});

createProduct.addEventListener("click", (event) => {
  event.preventDefault();
  if (event.target.matches("#cancel_form_product")) {
    createProduct.closest(".modal").classList.toggle("display_none");
    createProduct.reset();
  } else if (event.target.matches("#submit_create-product")) {
    const FD = new FormData(createProduct);
    const json = Object.fromEntries(FD);
    json.StoreId = storeId;
    console.log(json);
    sendRequest("POST", `${productsApiUrl}`, json)
      .then((response) => {
        console.log(response);
        createProduct.closest(".modal").classList.toggle("display_none");
        renderProducts();
        createProduct.reset();
      })
      .catch((response) => console.log(response.error.message));
  }
});

document.addEventListener("click", (event) => {
  if (event.target.matches(".delete_product_btn")) {
    modalDeleteProductConfirm.classList.toggle("display_none");
    productId = event.target.closest(".store__description").firstChild.lastChild
      .textContent;
  }
});

modalDeleteProductConfirm.addEventListener("click", (event) => {
  if (event.target.matches("#confirm_delete")) {
    modalDeleteProductConfirm.classList.toggle("display_none");
    deleteProduct(productId);
  } else if (event.target.matches("#reject_delete")) {
    modalDeleteProductConfirm.classList.toggle("display_none");
  }
});

function deleteProduct(productId) {
  sendRequest("DELETE", `${productsApiUrl}/${productId}`)
    .then((response) => {
      renderProducts();
    })
    .catch((response) => {
      console.log(response.error.message);
    });
}

//

function sendRequest(method, url, body = null) {
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
    if (method === "POST") {
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
}

function renderAllStores(requestUrl) {
  sendRequest("GET", requestUrl).then((response) => {
    renderStores(response);
  });
}

function renderStoreDetails(storeName) {
  sendRequest(
    "GET",
    `${storesApiUrl}/?filter={"where":{"Name":"${storeName}"}}`
  )
    .then((response) => {
      getStoreDetails(response);
      storeId = response[0].id;
      renderProducts();
    })
    .catch((response) => response.error.message);
}

function renderProducts() {
  sendRequest("GET", `${storesApiUrl}/${storeId}/rel_Products`)
    .then((response) => {
      allProducts = response.length;
      getStoreFilter(response);
      getProducts(response);
    })
    .catch((response) => {
      console.log(response.error.message);
    });
}

// Renders

function renderStores(arr) {
  storesList.innerHTML = "";
  arr.forEach((element) => {
    storesList.innerHTML += `<li class="stores__item">
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
}

function getStoreDetails(storeData) {
  storeDetails.innerHTML = "";
  storeDetails.innerHTML += ` 
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
}

function getStoreFilter(storeData) {
  storeFilters.innerHTML = "";
  storeFilters.innerHTML += `
    <div class="store__filter--all">
      ${allProducts}
      <span class="font-size-11 margin-left-5">All</span>
    </div>
    <div class="store__filter">
      <div class="store__filter_mg ">
        <div class="store__filter_brdr  store__filter_brdr-green">
          <img  class="filter" src="img/check-button.svg" alt="" />
        </div>
        <span class="store__filter_amount">${getStatusValue(
          storeData,
          "ok"
        )}</span>
          <span class="font-size-11 status">Ok</span></div>

      <div class="store__filter_mg ">
        <div class="store__filter_brdr store__filter_brdr-orange">
          <img class="filter" src="img/warning.svg" alt="" />
        </div>
        <span class="store__filter_amount">${getStatusValue(
          storeData,
          "storage"
        )}</span>
          <span class="font-size-11 status">Storage</span></div>

      <div class="store__filter_mg ">
        <div class="store__filter_brdr store__filter_brdr-red">
          <img class="filter"  src="img/exclamation-button.svg" alt="" />
        </div>
        <span class="store__filter_amount">${getStatusValue(
          storeData,
          "out"
        )}</span>
          <span class="font-size-11 status">Out of stock</span></div>
    </div>`;
}

function getProducts(storeData) {
  table.innerHTML = "";
  storeData.forEach((element) => {
    table.innerHTML += `<tr class="store__description"><td class="text_dec"><span class="text_dec"><b>${
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
      <p class="text_dec hidden-text" title="${element.ProductionCompanyName}">
      ${element.ProductionCompanyName}
      </p>
    </td>
    <td class="text_dec">
      <div class="rating-mini rating-mini_none">
        ${renderStars(element.Rating)}
      </div>
    </td>
    <td class="text_dec x_mark"><img class="delete_product_btn" src="/img/free-icon-x-mark-1617543.svg" alt=""></td>
  </tr>`;
  });
}
function renderStars(value) {
  const arr = [1, 2, 3, 4, 5];
  const stars = arr.map((element, index) => {
    if (index < value) {
      return `<span class="active"></span> `;
    } else {
      return `<span ></span> `;
    }
  });
  return stars;
}

// Helpers

function sortByParameters(params) {
  const paramToSort = productParameters[`${params}`];

  if (filterCounter.parameterName !== params) {
    filterCounter.parameterName = params;
    filterCounter.clickCount = 1;
  } else {
    filterCounter.clickCount += 1;
  }
  sendRequest("GET", `${storesApiUrl}/${storeId}/rel_Products`).then(
    (response) => {
      if (filterCounter.clickCount === 1) {
        let filteredProducts = response
          .slice()
          .sort((a, b) => (a[paramToSort] > b[paramToSort] ? 1 : -1));
        console.log(filteredProducts);
        getProducts(filteredProducts);
      } else if (filterCounter.clickCount === 2) {
        let filteredProducts = response
          .slice()
          .sort((a, b) => (a[paramToSort] < b[paramToSort] ? 1 : -1));
        getProducts(filteredProducts);
      } else {
        getProducts(response);
        filterCounter.clickCount = 0;
      }
    }
  );
}

function getStatusValue(store, statusName) {
  let outOfStock = 0;
  let ok = 0;
  let storage = 0;

  store.forEach((element) => {
    if (element.Status === "OUT_OF_STOCK") {
      outOfStock += 1;
    } else if (element.Status === "OK") {
      ok += 1;
    } else {
      storage += 1;
    }
  });

  if (statusName === "out") {
    return outOfStock;
  } else if (statusName === "ok") {
    return ok;
  } else {
    return storage;
  }
}

function findStrInObj(str, arr) {
  const regex = new RegExp(str, "i");

  return arr.filter((element) =>
    Object.keys(element).some((key) => regex.test(element[key]))
  );
}
