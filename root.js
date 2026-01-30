window.onload = () =>{
    handleScroll()
}
function handleScroll(){
    const navbar = document.querySelector('nav')
    const navitems = document.querySelector('.nav-links').querySelectorAll('a')
    const logo = document.querySelector('.logo')
    const donateBtn = document.querySelector('.donate-btn') 
    console.log(navitems)
    window.addEventListener('scroll',() =>{
    if(window.scrollY>0){
        navbar.classList.add('scrolled')
        logo.classList.add('scrolled')
        donateBtn.classList.add('scrolled')
        for(let i=0;i<navitems.length; i++){
            console.log(navitems[i])
            navitems[i].classList.add('scrolled')
        }
    }else{
        navbar.classList.remove('scrolled')
        logo.classList.remove('scrolled')
        donateBtn.classList.remove('scrolled')
        for(let i=0;i<navitems.length; i++){
            console.log(navitems[i])
            navitems[i].classList.remove('scrolled')
        }
    }
});
}

