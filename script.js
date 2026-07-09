document.addEventListener("DOMContentLoaded", () => {
    setupYear();
    setupMobileMenu();

    if (document.getElementById("salesCards")) {
        loadSalesCards("data/sales.json", "salesCards", 3);
    }

    if (document.getElementById("ebayCards")) {
        loadItemCards("data/ebay.json", "ebayCards", {
            limit: 8,
            random: true
        });
    }

    if (document.getElementById("homeCards")) {
        loadHomeCards();
    }
});

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
        const sales = await getJson("data/sales.json");
        const ebayItems = await getJson("data/ebay.json");

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