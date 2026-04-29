export function runAuthHandler(
  handler: (request: Request, context: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>,
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return handler(request, context);
}
