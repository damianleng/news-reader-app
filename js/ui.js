document.addEventListener("DOMContentLoaded", function () {
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
  
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });
});