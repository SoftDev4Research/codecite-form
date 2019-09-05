(function () {
  let submitBtn = document.getElementById("submitBtn");
  let downloadBtn = document.getElementById("downloadBtn");
  let cffLink = "";

  submitBtn.addEventListener("click", onSubmit);
  // downloadBtn.addEventListener("click", onDownload);

  function onSubmit (e) {
    e.preventDefault();

    let msgDiv = document.getElementById("message");
    let spinner = document.getElementById("spinner");
    let githubUrl = document.getElementById("githubUrl").value;
    let version = document.getElementById("version").value;

    submitBtn.style.display = "none";
    spinner.style.display = "inline-block";
    msgDiv.innerHTML = "";

    let token = document.getElementById("zenodoToken").value;
    if (!token.trim()) {
      spinner.style.display = "none";
      submitBtn.style.display = "inline-block";
      msgDiv.innerHTML = "Please enter a valid token.";
      return;
    }

    if (!githubUrl.trim()) {
      spinner.style.display = "none";
      submitBtn.style.display = "inline-block";
      msgDiv.innerHTML = "Please enter a valid GitHub URL.";
      return;
    }

    if (!version.trim()) {
      spinner.style.display = "none";
      submitBtn.style.display = "inline-block";
      msgDiv.innerHTML = "Please enter a valid version for the new release.";
      return;
    }

    fetch('/getDoi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        token
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.status == 0) {
          spinner.style.display = "none";
          submitBtn.style.display = "inline-block";
          msgDiv.innerHTML = "Error occurred!";
        } else {
          fetch('/generateCff', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              doi: res.message,
              githubUrl,
              version
            })
          })
            .then(res => res.json())
            .then(res => {
              if (res.status == 1) {
                document.getElementById("form").style.display = "none";
                document.getElementById("success").style.display = "block";
                document.getElementById("downloadCFF").setAttribute("action", res.message + "/CITATION.yml");
                document.getElementById("downloadJSON").setAttribute("action", res.message + "/zenodo.json");
              } else {
                spinner.style.display = "none";
                submitBtn.style.display = "inline-block";
                msgDiv.innerHTML = res.message;
              }
            })
            .catch(err => {
              console.log(err);
              spinner.style.display = "none";
              submitBtn.style.display = "inline-block";
              msgDiv.innerHTML = "Error occurred!";
            })
        }
      })
      .catch(err => {
        console.log(err);
        spinner.style.display = "none";
        submitBtn.style.display = "inline-block";
        msgDiv.innerHTML = "Error occurred!";
      });
  }

  // function onDownload (e) {
  //   e.preventDefault();

  //   console.log('Cff Link:', cffLink);

  //   if (!cffLink)
  //     return;
  //   else {
  //     fetch(`/download?cffLink=${cffLink}`, {
  //       method: 'GET'
  //     })
  //   }
  // }

})();