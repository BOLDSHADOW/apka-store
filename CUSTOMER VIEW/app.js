/* =========================================
   SEARCH PLACEHOLDER
========================================= */

const searchInput = document.getElementById("searchInput");

const searchTexts = [
    'Search "item name"',
    'Search "category"',
    'Search "store name"',
    'Search "product"'
];

let searchIndex = 0;

setInterval(() => {

    searchIndex++;

    if (searchIndex >= searchTexts.length) {
        searchIndex = 0;
    }

    searchInput.placeholder = searchTexts[searchIndex];

}, 2500);


/* =========================================
   VEG MODE
========================================= */

const vegToggle = document.getElementById("vegToggle");

vegToggle.addEventListener("click", () => {

    vegToggle.classList.toggle("on");

});


/* =========================================
   CATEGORY SELECTION
========================================= */

const categories = document.querySelectorAll(".category");

categories.forEach(category => {

    category.addEventListener("click", () => {

        categories.forEach(item => {
            item.classList.remove("active");
        });

        category.classList.add("active");

    });

});


/* =========================================
   FILTER BUTTONS
========================================= */

const filterButtons = document.querySelectorAll(".filters button");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(item => {
            item.classList.remove("filter-active");
        });

        button.classList.add("filter-active");

    });

});


/* =========================================
   BOTTOM NAVIGATION
========================================= */

const navigationItems =
    document.querySelectorAll(".nav-item");

navigationItems.forEach(item => {

    item.addEventListener("click", () => {

        navigationItems.forEach(nav => {
            nav.classList.remove("selected");
        });

        item.classList.add("selected");

    });

});


/* =========================================
   ORDER BUTTON
========================================= */

const orderButton =
    document.querySelector(".order-button");

orderButton.addEventListener("click", () => {

    alert("ORDER NOW clicked");

});


/* =========================================
   BOOKMARK
========================================= */

const bookmark =
    document.querySelector(".bookmark");

bookmark.addEventListener("click", () => {

    if (bookmark.textContent.trim() === "♡") {

        bookmark.textContent = "♥";

    } else {

        bookmark.textContent = "♡";

    }

});