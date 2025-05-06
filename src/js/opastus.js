// Opastus kirjautumiselle
document.addEventListener("DOMContentLoaded", () => {
  const infoButton = document.getElementById("infoButton");
  const infoModal = document.getElementById("infoModal");
  const loginfoModal = document.getElementById("logininfoModal");
  const closeButton = document.querySelector(".close-button");
  
  
  infoButton.addEventListener("click", () => {
    infoModal.style.display = "flex";
  });

  infoButton.addEventListener("click", () => {
    OmaInfoModal.style.display = "flex";
  });

  infoButton.addEventListener("click", () => {
    loginfoModal.style.display = "flex";
  });

  closeButton.addEventListener("click", () => {
    infoModal.style.display = "none";
  });

  closeButton.addEventListener("click", () => {
    loginfoModal.style.display = "none";
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
        //  Sulje klikkaamalla taustaa - loginfoModal
  window.addEventListener("click", function (e) {
    const logininfoModal = document.getElementById("logininfoModal");
    if (e.target === logininfoModal) {
      loginfoModal.style.display = "none";
    }
  });
});


//Opastus Päiväkirjalle
document.addEventListener("DOMContentLoaded", () => {
  //  Etsitään tarvittavat elementit
  const btn = document.getElementById("diaryInfoButton"); // i-nappi
  const modal = document.getElementById("diaryInfoModal"); // taustamodaali
  const closeBtn = document.querySelector(".close-button"); // Sulje-painike

  //  Avaa modaalin
  if (btn && modal) {
    btn.addEventListener("click", () => {
      modal.classList.add("show"); // näkyviin
    });
  }

  //  Sulje-napin toiminto
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("show"); // piiloon
    });
  }

  //  Sulje klikkaamalla taustaa
  window.addEventListener("click", function (e) {
    const modal = document.getElementById("diaryInfoModal");
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});

//Opastus Omat tiedot -sivulle
document.addEventListener("DOMContentLoaded", () => {
  const infoButton = document.getElementById("infoButton");
  const OmaInfoModal = document.getElementById("OmaInfoModal");
  
  if (infoButton && OmaInfoModal) {
    infoButton.addEventListener("click", () => {
      OmaInfoModal.style.display = "flex";
    });
    
    const closeButton2 = OmaInfoModal.querySelector(".oma-close-button");
    if (closeButton2) {
      closeButton2.addEventListener("click", () => {
        OmaInfoModal.style.display = "none";
      });
    }
    
    window.addEventListener("click", (e) => {
      if (e.target === OmaInfoModal) {
        OmaInfoModal.style.display = "none";
      }
    });
  }
});