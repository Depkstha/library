"use strict";

//accessing all dom
const gridButtons = document.querySelectorAll(".grid-view-btn");
const bookContainer = document.getElementById("bookContainer");
const sortSelect = document.getElementById("sort-select");
const searchInput = document.getElementById("search-input");
const BOOKS_PER_PAGE = 10;
let currentPage = 1;
let hasGridLayout = true;

// functionality to toggle list and grid view
gridButtons.forEach((button) => {
  button.addEventListener("click", () => {
    gridButtons.forEach((btn) => {
      btn.classList.remove("bg-amber-400/20", "border-amber-400/30");
      btn.classList.add("bg-white/5", "border-white/10");
    });

    button.classList.remove("bg-white/5", "border-white/10");
    button.classList.add("bg-amber-400/20", "border-amber-400/30");

    bookContainer.classList.toggle("grid-cols-1");
    bookContainer.classList.toggle("lg:grid-cols-1");
    bookContainer.classList.toggle("sm:grid-cols-1");

    bookContainer.querySelectorAll(".book-card").forEach((element) => {
      element.classList.toggle("flex");
      element.classList.toggle("p-4");
    });
    hasGridLayout = !hasGridLayout;
  });
});

//fetch books data
const fetchBooks = async (page = 1, query, limit = BOOKS_PER_PAGE) => {
  const API_URL = new URL("https://api.freeapi.app/api/v1/public/books");

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);

  if (query) params.set("query", query);

  API_URL.search = params.toString();

  const options = { method: "GET", headers: { accept: "application/json" } };

  try {
    const response = await fetch(API_URL, options);

    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    return response.json();
  } catch (error) {
    console.error(error.message);
  }
};

//generate book card to append in html
const renderBookCards = (books) => {
  bookContainer.innerHTML = books
    .map(
      ({
        volumeInfo: {
          title,
          authors,
          publisher,
          publishedDate,
          imageLinks: { thumbnail },
          infoLink,
        },
      }) => `
    <div class="book-card ${
      !hasGridLayout && "flex p-4"
    } group bg-gray-800/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-amber-400/30 hover:-translate-y-1">
    <div class="aspect-[5/4] bg-gray-700 relative overflow-hidden rounded-md">
    <img src="${thumbnail}"
    alt="${title}"
    class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105">
    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
    </div>
    <div class="p-4">
    <a target="_blank" href="${infoLink}">
        <h3 class="font-semibold text-lg mb-2 text-gray-100">${title}</h3>
        <p class="text-gray-400 mb-2">${authors.join(",")}</p>
        <div class="flex justify-between items-center text-sm text-gray-500">
          <span>${publisher}</span>
          <span>${publishedDate}</span>
        </div>
        </a>
      </div>
    </div>
  `
    )
    .join("");
};

const renderPagination = ({
  page,
  limit,
  previousPage,
  nextPage,
  totalItems,
  currentPageItems,
}) => {
  if (bookContainer.nextElementSibling)
    bookContainer.nextElementSibling.remove();

  currentPage = page;
  const previousPageIndex = currentPage - 1;
  const nextPageIndex = currentPage + 1;

  const html = `
        <div class="flex flex-col items-center mt-5">
  <span class="text-sm text-gray-700 dark:text-gray-400">
      Showing <span class="font-semibold text-gray-900 dark:text-white">${
        previousPageIndex * limit + 1
      }</span> to <span class="font-semibold text-gray-900 dark:text-white">${
    previousPageIndex * limit + currentPageItems
  }</span> of <span class="font-semibold text-gray-900 dark:text-white">${totalItems}</span> Entries
  </span>
  <div class="pagination inline-flex mt-2 xs:mt-0">
      <button ${
        !previousPage && "disabled"
      } class="prev-button flex items-center justify-center px-4 h-10 text-base font-medium text-white bg-gray-800 rounded-s hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          Prev
      </button>
      <button  ${
        !nextPage && "disabled"
      } class="next-button flex items-center justify-center px-4 h-10 text-base font-medium text-white bg-gray-800 border-0 border-s border-gray-700 rounded-e hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          Next
      </button>
  </div>
</div>`;

  bookContainer.insertAdjacentHTML("afterend", html);

  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");

  prevButton.addEventListener("click", (e) => {
    e.preventDefault();
    showBookCards(previousPageIndex);
  });

  nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    showBookCards(nextPageIndex);
  });
};

const showBookCards = async (page, query, sort) => {
  const response = await fetchBooks(page, query);
  let books = response?.data?.data;

  if (!books || books.length === 0) {
    bookContainer.innerHTML = `<div class="text-center"><p class="text-white/60">No books found</p></div>`;

    //remove pagination
    bookContainer.nextElementSibling.remove();
    return;
  }

  // Sorting logic
  books = books.sort((a, b) => {
    const dateA = new Date(a.volumeInfo.publishedDate);
    const dateB = new Date(b.volumeInfo.publishedDate);

    switch (sort) {
      case "newest":
        return dateB - dateA; // Newest first
      case "oldest":
        return dateA - dateB; // Oldest first
      case "a-z":
        return a.volumeInfo.title.localeCompare(b.volumeInfo.title);
      case "z-a":
        return b.volumeInfo.title.localeCompare(a.volumeInfo.title);
      default:
        return dateB - dateA;
    }
  });

  // Render sorted books
  renderBookCards(books);
  renderPagination(response?.data);
};

// Event listeners
searchInput.addEventListener("keyup", (e) =>
  showBookCards(currentPage, e.target.value, sortSelect.value)
);

sortSelect.addEventListener("change", (e) =>
  showBookCards(currentPage, searchInput.value, e.target.value)
);

document.addEventListener("DOMContentLoaded", () => {
  showBookCards();
});
