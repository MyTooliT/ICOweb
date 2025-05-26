export function useAPI(apiBase: string) {

  // eslint-disable-next-line max-len
  async function get<ResponseType>(endpoint: string): Promise<ResponseType> {
    return new Promise((resolve, reject) => {
      sendRequest<ResponseType>(apiBase, endpoint, 'GET', undefined)
          .then(resolve)
          .catch(reject);
    });
  }

  // eslint-disable-next-line max-len
  async function post<BodyType, ResponseType>(endpoint: string, body: BodyType): Promise<ResponseType> {
    return new Promise((resolve, reject) => {
      sendRequest<ResponseType>(apiBase, endpoint, 'POST', body)
          .then(resolve)
          .catch(reject);
    });
  }

  // eslint-disable-next-line max-len
  async function put<BodyType, ResponseType>(endpoint: string, body: BodyType): Promise<ResponseType> {
    return new Promise((resolve, reject) => {
      sendRequest<ResponseType>(apiBase, endpoint, 'PUT', body)
          .then(resolve)
          .catch(reject);
    });
  }

  // eslint-disable-next-line max-len
  async function del<BodyType, ResponseType>(endpoint: string, body: BodyType):
      Promise<ResponseType> {
    return new Promise((resolve, reject) => {
      sendRequest<ResponseType>(apiBase, endpoint, 'DELETE', body)
          .then(resolve)
          .catch(reject);
    });
  }

  return {
    get,
    post,
    put,
    del
  }
}

async function sendRequest<ResponseType>(
  apiBase: string, endpoint: string, method: string, body: any
): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    const requestOptions= {
      method: method,
      body: body !== undefined ? JSON.stringify(body) : body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    fetch(
      `${apiBase}/${endpoint}`,
      requestOptions,
    )
      .then(async (response) => {
        if ([200, 201, 202, 203, 204].includes(response.status)) {
          try {
            const ret = await response.json() as ResponseType
            resolve(ret);
          } catch(e) {
            // Note: This feels very sketchy.
            resolve(undefined as ResponseType)
          }
        } else {
          reject(
              {
                error: true,
                status: response.status,
                message: await response.text()
              }
          );
        }
      })
      .catch((err) => {
        reject({
          error: true,
          message: err.message,
        });
      });
  });
}

