export function okResponse<T>(data: T) {
  return {
    ok: true,
    data,
  };
}