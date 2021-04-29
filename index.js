import { storesBase } from "./data.js";

const storesList = document.querySelector(".show-stores");
const searchInput = document.querySelector(".search__btn-loupe");
const refreshSearchInput = document.querySelector(".search__btn-reset");
const productsSearch = document.querySelector("#product_search");
const sort = document.querySelector(".column__sort");

drawStores(storesBase);

document.addEventListener("click", (event) => {
  if (event.target.matches("#product_search")) {
    const searchValue = document.querySelector("#product_search_field").value;
    const table = document.querySelector(".products__body");
    const email = document.querySelector("#email").textContent;
    const arr = findStrInObj(email, storesBase);
    const lastArr = findStrInObj(searchValue, arr[0].rel_Products);
    showStoresDetails();
    showStoresInfo(table, findStrInObj(searchValue, arr[0].rel_Products));
  }
});

storesList.addEventListener("click", (event) => {
  const store = event.target.closest(".stores__item");
  const storeName = store.children[0].children[0].innerHTML;
  console.log(document.querySelector(".no-store").style.display);

  document.querySelector(".no-store").style.display = "none";

  storesBase.forEach((element) => {
    if (element.Name === storeName) {
      showStoresDetails(element);
      const table = document.querySelector(".products__body");
      console.log(table);
      showStoresInfo(table, element.rel_Products);
    }
  });
});

searchInput.addEventListener("click", (event) => {
  const searchValue = document.querySelector(".search__field").value;
  drawStores(findStrInObj(searchValue, storesBase));
});

if (sort) {
  sort.addEventListener("click", (event) => {
    sort.classList.toggle(".column__sort_rotate");
    console.log(f);
  });
}

function drawStores(arr) {
  document.querySelector(".show-stores").innerHTML = "";
  arr.forEach((element) => {
    document.querySelector(
      ".show-stores"
    ).innerHTML += `<li class="stores__item">
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

refreshSearchInput.addEventListener("click", (event) => {
  document.querySelector(".search__field").value = "";
  drawStores(storesBase);
});

function showStoresDetails(storeData) {
  console.log(storeData);
  document.querySelector(".store__container").innerHTML = "";
  document.querySelector(
    ".store__container"
  ).innerHTML += ` <div class="store__details">
    <h2 class="header_pd">Store Details</h2>
    <div class="store__details--info">
      <ul class="store__details--info_col store__details--info_font-s-13">
        <li><b >Email:</b>
         <span id="email">${storeData.Email}</span> 
        </li>
        <li>
          <b>Phone Number:</b>
          ${storeData.PhoneNumber}
        </li>
        <li>
          <b>address:</b>
          ${storeData.Address}
        </li>
        <li>
          <b>Established Date:</b>
          ${new Date(Date.parse(storeData.Established)).toDateString()}
        </li>
        <li>
          <b>Floor Area:</b>
          ${storeData.FloorArea}
          
        </li>
      </ul>
    </div>

    <div class="stores__search_btn">
      <img
        class="stores__search_btn-style"
        src="/img/arrow-down-sign-to-navigate.svg"
        alt=""
      />
      <img class="stores__search_btn-style" src="/img/clip.svg" alt="" />
    </div>

    <div class="store__filter">
      <div class="store__sort--all">
      ${storeData.rel_Products.length}
        
        <span class="font-size-11 margin-left-5">All</span>
      </div>
      <div class="store__sort">
        <div class="store__sort_mg">
          <div class="store__sort_brdr store__sort_brdr-green">
            <img src="img/check-button.svg" alt="" />
          </div>
          <span class="font-size-11">Ok</span>
          <span class="store__sort_amount">${getStatusValue(
            storeData.rel_Products,
            "ok"
          )}</span>
        </div>

        <div class="store__sort_mg">
          <div class="store__sort_brdr store__sort_brdr-orange">
            <img src="img/warning.svg" alt="" />
          </div>
          <span class="font-size-11">Storage</span>
          <span class="store__sort_amount">${getStatusValue(
            storeData.rel_Products,
            "storage"
          )}</span>
        </div>

        <div class="store__sort_mg">
          <div class="store__sort_brdr store__sort_brdr-red">
            <img src="img/exclamation-button.svg" alt="" />
          </div>
          <span class="font-size-11">Out of stock</span>
          <span class="store__sort_amount">${getStatusValue(
            storeData.rel_Products,
            "out"
          )}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="store__products">
          <table class="products" cellpadding="10px">
            <caption class="products__header products__header_main">
              Products
              <div class="search__container products__filter">
                <input class="search__field" id="product_search_field" type="search" placeholder="search" />
                <input type="submit" id="product_search" class="search__btn-loupe" value="" />
              </div >
            </caption>
            <thead>
              <tr class="products__header">
              <th class="text_dec">Name <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
              <th><span style="max-width: 50px">Price</span> <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
                <th class="text_dec">Specs <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
                <th class="text_dec">SupplerInfo <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
                <th class="text_dec">Country of origin <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
                <th class="text_dec">Prod. company <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
                <th class="rating-mini_none">Rating <img class="column__sort" src="/img/free-icon-two-opposite-up-and-down-arrows-side-by-side-60798.svg" alt=""></th>
              </tr>
            </thead>
            <tbody class="products__body">
            </tbody>
            `;
}

function showStoresInfo(container, storeData) {
  container.innerHTML = "";
  storeData.forEach((element) => {
    container.innerHTML += `<tr class="store__description">
    <td class="text_dec">
      <span class="text_dec">
        <b>${element.Name}</b> <br /><br />
      </span>
      1
    </td>
    <td class="text_dec">
      <span class="text_dec"><b>${element.Price}</b> USD</span>
    </td>
    <td class="text_dec">
      <p
        class="text_dec hiden-text"
        title="${element.Specs}"
      >
      ${element.Specs}
      </p>
    </td>
    <td class="text_dec hiden-text">
      <p
        class="text_dec"
        title="${element.SupplierInfo}"
      >
      ${element.SupplierInfo}
      </p>
    </td>
    <td class="text_dec"> ${element.MadeIn}</td>
    <td class="text_dec">
      <p
        class="text_dec hiden-text"
        title="${element.ProductionCompanyName}"
      >
      ${element.ProductionCompanyName}
      </p>
    </td>
    <td class="text_dec">
      <div class="rating-mini rating-mini_none">
        <span class="active"></span>
        <span class="active"></span>
        <span class="active"></span>
        <span></span>
        <span></span>
      </div>
    </td>
  </tr>`;
  });
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
