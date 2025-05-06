document.addEventListener("DOMContentLoaded", () => {
    const infoButton = document.getElementById("infoButton");
    const infoModal = document.getElementById("infoModal");
    const closeButton = document.querySelector(".close-button");
    const modal = document.getElementById("InfoModal"); // taustamodaali
    
    infoButton.addEventListener("click", () => {
      infoModal.style.display = "flex";
    });
  
    closeButton.addEventListener("click", () => {
      infoModal.style.display = "none";
    });
  
    window.addEventListener("click", (e) => {
      if (e.target === infoModal) {
        infoModal.style.display = "none";
      }});

          //  Sulje klikkaamalla taustaa
    window.addEventListener("click", function (e) {
      const modal = document.getElementById("InfoModal");
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });