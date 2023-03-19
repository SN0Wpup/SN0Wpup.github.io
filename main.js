function waveThing(URL){
    document.getElementById("waveBtn").classList='waveClick';
    document.getElementById('navBar').remove();
    const waves = document.querySelectorAll('.waves');
    waves.forEach(wave =>{
        wave.style.position = "absolute";
        wave.style.height = "10%";
    });
    setTimeout( function() { window.location.href = URL }, 500 );

}