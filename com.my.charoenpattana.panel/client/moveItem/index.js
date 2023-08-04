$("#confirm").on("click", e => {
  var goodcode = $("#goodcode").val();
  if (goodcode == "") {
    alert("โปรดระบุรหัสที่ต้องการเริ่มขยับ");
    return;
  }
  if (confirm(`ต้องการเริ่มขยับจาก "${goodcode}" หรือไม่`)) {
    jsx.evalScript(`startMoveItem("${goodcode}")`, res => {
      console.log(res);
      alert("สำเร็จ โปรดตรวจสอบก่อนบันทึก");
    });
  }
});
