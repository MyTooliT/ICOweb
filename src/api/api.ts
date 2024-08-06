async function sendRequest<ResponseType>(
  endpoint: string, method: string, body: any
): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    const protocol = import.meta.env.VITE_API_PROTOCOL;
    const hostname = import.meta.env.VITE_API_HOSTNAME;
    const port = import.meta.env.VITE_API_PORT;
    const version = import.meta.env.VITE_API_VERSION;

    const requestOptions= {
      method: method,
      body: body !== undefined ? JSON.stringify(body) : body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    fetch(
      `${protocol}://${hostname}:${port}/api/${version}/${endpoint}`,
      requestOptions,
    )
      .then(async (response) => {
        if (response.status !== 200) {
          reject(
            Object.assign(
              {
                error: true,
                status: response.status,
              },
              await response.json(),
            ),
          );
        } else {
          resolve(await response.json() as ResponseType);
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

// eslint-disable-next-line max-len
export async function get<ResponseType>(endpoint: string): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    sendRequest<ResponseType>(endpoint, 'GET', undefined)
      .then(resolve)
      .catch(reject);
  });
}

// eslint-disable-next-line max-len
export async function post<BodyType, ResponseType>(endpoint: string, body: BodyType): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    sendRequest<ResponseType>(endpoint, 'POST', body)
      .then(resolve)
      .catch(reject);
  });
}

// eslint-disable-next-line max-len
export async function put<BodyType, ResponseType>(endpoint: string, body: BodyType): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    sendRequest<ResponseType>(endpoint, 'PUT', body)
      .then(resolve)
      .catch(reject);
  });
}

// eslint-disable-next-line max-len
export async function del<BodyType, ResponseType>(endpoint: string, body: BodyType):
  Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    sendRequest<ResponseType>(endpoint, 'DELETE', body)
      .then(resolve)
      .catch(reject);
  });
}
