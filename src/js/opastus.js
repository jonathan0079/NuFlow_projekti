// Opastus kirjautumiselle
document.addEventListener("DOMContentLoaded", () => {
  const infoButton = document.getElementById("infoButton"); // i-nappi
  const infoModal = document.getElementById("infoModal"); // taustamodaali
  const loginfoModal = document.getElementById("logininfoModal"); // taustamodaali - login
  const closeButton = document.querySelector(".close-button"); // Sulje-painike
  
    //  Avaa modaalin
  infoButton.addEventListener("click", () => {
    infoModal.style.display = "flex";
  });
  //  Avaa modaalin
  infoButton.addEventListener("click", () => {
    OmaInfoModal.style.display = "flex";
  });
  //  Avaa modaalin
  infoButton.addEventListener("click", () => {
    loginfoModal.style.display = "flex";
  });
  //  Sulkee modaalin
  closeButton.addEventListener("click", () => {
    infoModal.style.display = "none";
  });
  //  Sulkee modaalin
  closeButton.addEventListener("click", () => {
    loginfoModal.style.display = "none";
  });
  //  Sulkee modaalin
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

  const btn = document.getElementById("diaryInfoButton"); // i-nappi
  const modal = document.getElementById("diaryInfoModal"); // taustamodaali
  const closeBtn = document.querySelector(".close-button"); // Sulje-painike

  //  Avaa modaalin
  if (btn && modal) {
    btn.addEventListener("click", () => {
      modal.classList.add("show");
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

    //  Avaa modaalin
  if (infoButton && OmaInfoModal) {
    infoButton.addEventListener("click", () => {
      OmaInfoModal.style.display = "flex";
    });
      //  Sulkee modaalin
    const closeButton2 = OmaInfoModal.querySelector(".oma-close-button");
    if (closeButton2) {
      closeButton2.addEventListener("click", () => {
        OmaInfoModal.style.display = "none";
      });
    }
      //  Sulje klikkaamalla taustaa
    window.addEventListener("click", (e) => {
      if (e.target === OmaInfoModal) {
        OmaInfoModal.style.display = "none";
      }
    });
  }
});

//Opastus Asetukset -sivulle
document.addEventListener("DOMContentLoaded", () => {
  const settingsinfoButton = document.getElementById("settingsinfoButton"); // i-nappi
  const infoModal = document.getElementById("settingsinfoModal"); // taustamodaali
  const closeButton = document.querySelector(".close-button"); // Sulje-painike
  
      //  Avaa modaalin
  settingsinfoButton.addEventListener("click", () => {
    infoModal.style.display = "flex";
  });
      //  Sulkee modaalin
  closeButton.addEventListener("click", () => {
    infoModal.style.display = "none";
  });

  //  Sulje klikkaamalla taustaa
  window.addEventListener("click", function (e) {
    const modal = document.getElementById("settingsinfoModal");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});