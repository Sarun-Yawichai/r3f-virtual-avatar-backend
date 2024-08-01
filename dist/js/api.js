function createFile_api(blob) {
  var formdata = new FormData();
  formdata.append("recording", blob);

  var requestOptions = {
    method: "POST",
    body: formdata,
    redirect: "follow",
  };

  const backendUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':3000' : ''}`;

  const response = fetch(backendUrl + "/record", requestOptions);
  response
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}
