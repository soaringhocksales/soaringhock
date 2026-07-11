const DATA_VERSION = "1.0.0";

document.addEventListener("DOMContentLoaded", () => {
    setupYear();
    setupMobileMenu();

    if (document.getElementById("homeCards")) {
        console.log("Loading homepage cards...");
        loadHomeCards();
    }

    if (document.getElementById("salesCards")) {
        console.log("Loading sales cards...");
        loadSalesCards(`data/sales.json?v=${DATA_VERSION}`, "salesCards", 3);
    }

    if (document.getElementById("ebayCards")) {
        console.log("Loading eBay cards...");
        loadEbayPage(`data/ebay.json?v=${DATA_VERSION}`);
    }
});

let allEbayItems = [];

function setupMobileMenu() {
    const menuButton = document.querySelector("#menuButton");
    const navLinks = document.querySelector("#navLinks");

    if (menuButton && navLinks) {
        menuButton.addEventListener("click", () => {
            navLinks.classList.toggle("open");
        });
    }
}

function setupYear() {
    const year = document.querySelector("#year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }
}

async function getJson(filePath) {
    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`Could not load ${filePath}`);
    }

    return response.json();
}

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function pickItems(items, limit, random = false) {
    const source = random ? shuffleArray(items) : items;
    return source.slice(0, limit);
}

async function loadItemCards(jsonFile, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const limit = options.limit || 3;
    const random = options.random || false;

    try {
        const items = await getJson(jsonFile);
        console.log(`Loaded ${items.length} items from ${jsonFile}`);

        const selectedItems = pickItems(items, limit, random);

        container.innerHTML = "";

        selectedItems.forEach(item => {
            container.appendChild(createItemCard(item));
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load listings right now.</p>`;
    }
}

async function loadSalesCards(jsonFile, containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const sales = await getJson(jsonFile);
        console.log(`Loaded ${sales.length} sales from ${jsonFile}`);

        const selectedSales = sales.slice(0, limit);

        container.innerHTML = "";

        selectedSales.forEach(sale => {
            container.appendChild(createSaleCard(sale));
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load upcoming sales right now.</p>`;
    }
}

async function loadHomeCards() {
    const container = document.getElementById("homeCards");
    if (!container) return;

    try {
        const sales = await getJson(`data/sales.json?v=${DATA_VERSION}`);
        const ebayItems = await getJson(`data/ebay.json?v=${DATA_VERSION}`);

        console.log(`Loaded homepage data: ${sales.length} sales, ${ebayItems.length} eBay items`);

        const firstSale = sales[0];
        const randomEbayItems = pickItems(ebayItems, 2, true);

        container.innerHTML = "";

        if (firstSale) {
            container.appendChild(
                createItemCard({
                    title: firstSale.title,
                    description: firstSale.description,
                    image: firstSale.image,
                    url: firstSale.url,
                    buttonText: "View Whatnot Sale"
                })
            );
        }

        randomEbayItems.forEach(item => {
            container.appendChild(createItemCard(item));
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load featured items right now.</p>`;
    }
}

async function loadEbayPage(jsonFile) {
    const container = document.getElementById("ebayCards");
    const filterContainer = document.getElementById("categoryFilter");

    if (!container) return;

    try {
        allEbayItems = await getJson(jsonFile);
        console.log(`Loaded ${allEbayItems.length} eBay items from ${jsonFile}`);

        renderCategoryButtons(allEbayItems, filterContainer);
        renderEbayCards(allEbayItems, "All");
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load listings right now.</p>`;
    }
}

function renderCategoryButtons(items, filterContainer) {
    if (!filterContainer) return;

    const categories = [
        "All",
        ...new Set(items.map(item => item.category).filter(Boolean))
    ];

    filterContainer.innerHTML = "";

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "category-button";
        button.textContent = category;
        button.dataset.category = category;

        if (category === "All") {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            document.querySelectorAll(".category-button").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            renderEbayCards(allEbayItems, category);
        });

        filterContainer.appendChild(button);
    });
}

function renderEbayCards(items, category) {
    const container = document.getElementById("ebayCards");
    if (!container) return;

    let selectedItems = items;

    if (category !== "All") {
        selectedItems = items.filter(item => item.category === category);
    } else {
        selectedItems = pickItems(items, 9, true);
    }

    container.innerHTML = "";

    selectedItems.forEach(item => {
        container.appendChild(createItemCard(item));
    });

    if (selectedItems.length === 0) {
        container.innerHTML = `<p class="load-error">No listings found in this category yet.</p>`;
    }
}

function createItemCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="card-thumbnail">

        <h3>${item.title}</h3>

        <p>${item.description}</p>

        <a href="${item.url}" target="_blank" rel="noopener noreferrer">
            ${item.buttonText || "View Item"} →
        </a>
    `;

    return card;
}

function createSaleCard(sale) {
    const card = document.createElement("article");
    card.className = "sale-card";

    card.innerHTML = `
        <div class="sale-date">
            <span class="month">${sale.month || "TBD"}</span>
            <span class="day">${sale.day || "--"}</span>
        </div>

        <img src="${sale.image}" alt="${sale.title}" class="sale-thumbnail">

        <div class="sale-info">
            <h2>${sale.title}</h2>

            <p>${sale.description}</p>

            <a class="button secondary" href="${sale.url}" target="_blank" rel="noopener noreferrer">
                ${sale.buttonText || "View Sale"}
            </a>
        </div>
    `;

    return card;
}