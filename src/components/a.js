window.addEventListener("load", () => {
  const elTarget = document.querySelector("#target");
  elTarget.addEventListener("pointerdown", function (e) {
    const that = e.currentTarget;
    that.addEventListener("pointermove", doslider);
    that.setPointerCapture(e.pointerId);
  });

  elTarget.addEventListener("pointerup", function (e) {
    const that = e.currentTarget;
    that.addEventListener("pointermove", null);
    that.releasePointerCapture(e.pointerId);
  });

  function doslider(e) {
    e.currentTarget.style.transform = `translate(${e.clientX - 50}px)`;
  }
});

function beginSliding(e) {
  slider.onpointermove = slide;
  slider.setPointerCapture(e.pointerId);
}

function stopSliding(e) {
  slider.onpointermove = null;
  slider.releasePointerCapture(e.pointerId);
}

function slide(e) {
  slider.style.transform = `translate(${e.clientX - 70}px)`;
}

const slider = document.getElementById("slider");

slider.onpointerdown = beginSliding;
slider.onpointerup = stopSliding;

// const { clientLeft, offsetLeft, scrollLeft } = droppable;
// console.log(
//   "[clientLeft, offsetLeft, scrollLeft][",
//   clientLeft,
//   offsetLeft,
//   scrollLeft,
//   "]",
// );
// console.log(
//   "[",
//   event.pageX,
//   event.clientX,
//   event.offsetX,
//   event.layerX,
//   event.screenX,
//   event.tiltX,
//   event.movementX,
//   "]",
// );
