// Halaman Current Asset

function rCA(){
  const data=sortArr(DB.ca,'t-ca');
  mkTbl('t-ca',['#','Nama','Kategori','Jumlah','Tanggal Update','Note','Aksi'],
    data.map((r,i)=>`<tr>
      <td>${i+1}</td><td>${r.name}</td>
      <td><span class="badge bb">${r.category}</span></td>
      <td><b>${fRp(r.amount)}</b></td>
      <td>${r.date}</td>
      ${noteCell(r.note)}
      <td><button class="btn-sm be" onclick="openE('ca','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('ca','${r.id}','${escQ(r.name)}')">Hapus</button></td>
    </tr>`));
}
