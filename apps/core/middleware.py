from django.conf import settings


class NoIndexMiddleware:
    """While settings.SITE_NOINDEX is on (previews), ask search engines not to
    index or follow any response, including files and error pages."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if settings.SITE_NOINDEX:
            response['X-Robots-Tag'] = 'noindex, nofollow'
        return response
