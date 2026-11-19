$("#confirm").on("click", async e => {
  var goodcode = $("#goodcode").val();
  if (goodcode == "") {
    alert("โปรดระบุรหัสที่ต้องการเริ่มขยับ");
    return;
  }
  var mode = $("input[name=mode]:checked").val();
  var question = mode == "remove" ? `ต้องการลบ "${goodcode}" และเลื่อนรายการถัดไปขึ้น หรือไม่` : `ต้องการเริ่มขยับจาก "${goodcode}" หรือไม่`;
  if (confirm(question)) {
    var res = await runJsx(`startMoveItem(${JSON.stringify(goodcode)}, "${mode}")`);
    alert("สำเร็จ โปรดตรวจสอบก่อนบันทึก\n" + res);
  }
});
