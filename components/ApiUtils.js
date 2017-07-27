// ApiUtils.js

const ApiUtils = {
  checkStatus(response) {
    return new Promise(((resolve, reject) => {
      if (response.status >= 200 && response.status < 300) {
        resolve(response);
      } else {
        const error = new Error(response.statusText);
        error.code = response.status;
        error.response = response;
        response.text().then((text) => {
          error.message = text;
          reject(error);
        });
      }
    }));
  }
};

export { ApiUtils as default };
