export function getAPILink(): string {
  const protocol = import.meta.env.VITE_API_PROTOCOL;
  const hostname = import.meta.env.VITE_API_HOSTNAME;
  const port = import.meta.env.VITE_API_PORT;
  const version = import.meta.env.VITE_API_VERSION;

  return `${protocol}://${hostname}:${port}/api/${version}`
}

async function sendRequest<ResponseType>(
  endpoint: string, method: string, body: any
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
      `${getAPILink()}/${endpoint}`,
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
            Object.assign(
              {
                error: true,
                status: response.status,
              },
              await response.json(),
            ),
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
