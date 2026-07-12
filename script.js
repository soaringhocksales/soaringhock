const DATA_VERSION = Date.now();

document.addEventListener("DOMContentLoaded", () => {
    setupYear();
    setupMobileMenu();

    if (document.getElementById("nextSaleCard")) {
        console.log("Loading next sale hero card...");
        loadNextSaleCard();
    }

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

    if (document.getElementById("consignmentCards")) {
        console.log("Loading consignment cards...");
        loadConsignmentPage(`data/consignments.json?v=${DATA_VERSION}`);
    }
});

let allEbayItems = [];
let allConsignmentItems = [];

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
function isActiveItem(item) {
    return item.id && !item.id.startsWith("!");
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

        let consignmentItems = [];

        try {
            consignmentItems = await getJson(`data/consignments.json?v=${DATA_VERSION}`);
        } catch (error) {
            console.warn("No consignments file found or could not load consignments.json");
        }

        console.log(
            `Loaded homepage data: ${sales.length} sales, ${ebayItems.length} eBay items, ${consignmentItems.length} consignment items`
        );

        const firstSale = sales[0];
        const randomEbayItems = pickItems(ebayItems, 2, true);

        const availableConsignments = consignmentItems.filter(item => {
            const isActive = isActiveItem(item);
            const isNotSold = !item.status || item.status.toLowerCase() !== "sold";

            return isActive && isNotSold;
        });

        const randomConsignment = pickItems(availableConsignments, 1, true)[0];

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

        if (randomConsignment) {
            const randomEbayItem = pickItems(ebayItems, 1, true)[0];

            if (randomEbayItem) {
                container.appendChild(createItemCard(randomEbayItem));
            }

            container.appendChild(createConsignmentCard(randomConsignment));
        } else {
            randomEbayItems.forEach(item => {
                container.appendChild(createItemCard(item));
            });
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load featured items right now.</p>`;
    }
}

async function loadNextSaleCard() {
    const card = document.getElementById("nextSaleCard");
    if (!card) return;

    try {
        const sales = await getJson(`data/sales.json?v=${DATA_VERSION}`);
        const nextSale = sales[0];

        if (!nextSale) {
            card.innerHTML = `
                <h2>Next Live Sale</h2>
                <p class="card-date">Coming soon</p>
                <p>
                    We’ll post our next Whatnot show here once it is scheduled.
                </p>
                <a href="sales.html">View schedule →</a>
            `;
            return;
        }

        const saleDate = `${nextSale.month || "TBD"} ${nextSale.day || ""}`.trim();

        card.innerHTML = `
            <h2>${nextSale.title || "Next Live Sale"}</h2>
            <p class="card-date">${saleDate || "Coming soon"}</p>
            <p>
                ${nextSale.description || "Check out our next scheduled Whatnot live sale."}
            </p>
            <a href="${nextSale.url || "sales.html"}" target="_blank" rel="noopener noreferrer">
                ${nextSale.buttonText || "View schedule"} →
            </a>
        `;
    } catch (error) {
        console.error(error);

        card.innerHTML = `
            <h2>Next Live Sale</h2>
            <p class="card-date">Coming soon</p>
            <p>
                We’ll post our next Whatnot show here once it is scheduled.
            </p>
            <a href="sales.html">View schedule →</a>
        `;
    }
}

async function loadEbayPage(jsonFile) {
    const container = document.getElementById("ebayCards");
    const filterContainer = document.getElementById("categoryFilter");

    if (!container) return;

    try {
        allEbayItems = await getJson(jsonFile);
        console.log(`Loaded ${allEbayItems.length} eBay items from ${jsonFile}`);

        renderCategoryButtons(allEbayItems, filterContainer, "ebay");
        renderEbayCards(allEbayItems, "All");
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load listings right now.</p>`;
    }
}

async function loadConsignmentPage(jsonFile) {
    const container = document.getElementById("consignmentCards");
    const filterContainer = document.getElementById("consignmentCategoryFilter");

    if (!container) return;

    try {
        const consignmentData = await getJson(jsonFile);

        allConsignmentItems = consignmentData.filter(isActiveItem);

        console.log(`Loaded ${allConsignmentItems.length} active consignment items from ${jsonFile}`);

        renderCategoryButtons(allConsignmentItems, filterContainer, "consignment");
        renderConsignmentCards(allConsignmentItems, "All");
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="load-error">Could not load consignment items right now.</p>`;
    }
}

function renderCategoryButtons(items, filterContainer, pageType) {
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
            filterContainer.querySelectorAll(".category-button").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            if (pageType === "ebay") {
                renderEbayCards(allEbayItems, category);
            }

            if (pageType === "consignment") {
                renderConsignmentCards(allConsignmentItems, category);
            }
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

function renderConsignmentCards(items, category) {
    const container = document.getElementById("consignmentCards");
    if (!container) return;

    let selectedItems = items;

    if (category !== "All") {
        selectedItems = items.filter(item => item.category === category);
    }

    container.innerHTML = "";

    selectedItems.forEach(item => {
        container.appendChild(createConsignmentCard(item));
    });

    if (selectedItems.length === 0) {
        container.innerHTML = `<p class="load-error">No consignment items found in this category yet.</p>`;
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

function createConsignmentCard(item) {
    const card = document.createElement("article");
    card.className = "item-card consignment-card";

    const isSold = item.status && item.status.toLowerCase() === "sold";
    const buttonClass = isSold ? "consignment-button sold" : "consignment-button";
    const buttonText = isSold ? "Sold" : (item.buttonText || "Buy Now");
    const buttonUrl = isSold ? "#" : item.url;

    card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="card-thumbnail">

        <div class="item-meta-row">
            <span class="item-price">${item.price || ""}</span>
            <span class="item-status">${item.status || "Available"}</span>
        </div>

        <h3>${item.title}</h3>

        <p>${item.description}</p>

        <p class="item-id">${item.id || ""}</p>

        <a class="${buttonClass}" href="${buttonUrl}" target="_blank" rel="noopener noreferrer">
            ${buttonText} →
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