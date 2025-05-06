document.addEventListener("DOMContentLoaded", () => {
    const infoButton = document.getElementById("infoButton");
    const infoModal = document.getElementById("infoModal");
    const closeButton = document.querySelector(".close-button");
  
    if (infoButton && infoModal) {
      infoButton.addEventListener("click", () => {
        infoModal.classList.add("show");
      });
    }
  
    if (closeButton && infoModal) {
      closeButton.addEventListener("click", () => {
        infoModal.classList.remove("show");
      });
    }
  
    window.addEventListener("click", (e) => {
      if (e.target === infoModal) {
        infoModal.classList.remove("show");
      }
    });
  });
  