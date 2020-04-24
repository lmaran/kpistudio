# Formatul mesajului de eroare

Alege ce campuri trebuie sa contina mesajul de eroare

## Alternativele luate in considerare

### 1. Format propriu, bazat pe ce folosesc Facebook, Google etc

- asta am folosit la precedentul proiect (CT)
Exemplu:

```json
{
    "code": 1024,
    "message": "Validation Failed",
    "errors": [
        {
            "field": "first_name",
            "message": "First name cannot have special ch."
        }
    ]
}
```

### 2. Format standard: [JSON:api:error](https://jsonapi.org/format/#errors)

Exemplu:

HTTP/1.1 422 Unprocessable Entity
Content-Type: application/vnd.api+json

```json
{
    "errors": [
        {
            "source": { "pointer": "/data/attributes/firstName" },
            "title": "Invalid Attribute",
            "detail": "First name must contain at least three characters."
        },
        {
            "source": { "pointer": "/data/attributes/firstName" },
            "title": "Invalid Attribute",
            "detail": "First name must contain an emoji."
        }
    ]
}
```

### 3. Format standard: [rfc 7807](https://tools.ietf.org/html/rfc7807)

- specificatii: [rfc 7807](https://tools.ietf.org/html/rfc7807)
- este un format standard, in forma finala
- [Http-problem](https://github.com/PDMLab/http-problem) - librarie Node.js care te ajuta sa produci raspunsuri http compatibile cu acest standard
- pare cea mai moderna alegere
- .Net Core 2.1 a introdus suport pt. asta. Detalii [aici](https://codeopinion.com/http-api-problem-details-in-asp-net-core/) sau [aici](https://www.alexdresko.com/2018/06/01/what-is-asp-net-core-2-1-api-problem-details-rfc-7807/)
- articole in care se face referire la acest standard:
  - 05-2018: [<https://blog.restcase.com/rest-api-error-handling-problem-details-response/]>
  - 04-2019: [<https://apisyouwonthate.com/blog/]creating-good-api-errors-in-rest-graphql-and-grpc>
  - 02-2018: [<https://apisyouwonthate.com/blog/the-many-amazing-uses-of-json-schema-client-side-validation]>
  - ???: [<http://work.haufegroup.io/api-style-guide/error-handling/error-handling.html]>
  - 07-2017: [<https://www.codementor.io/amandeepmidha/good-user-experience-and-api-success-both-require-clarity-in-api-responses-ag3m6764z]>

Mesajul are urmatoarea structura (si poate fi extins):

```json
{
    "type": "(string) - a URL to a document describing the error condition (optional, and 'about:blank' is assumed if none is provided",
    "title": "string) - a short, human-readable title for the general error type; the title should not change for given types.",
    "status": "(number) - conveying the HTTP status code; this is so that all information is in one place, but also to correct for changes in the status code due to the usage of proxy servers",
    "detail": "(string) - a human-readable description of the specific error.",
    "instance": "(string) - This optional key may be present, with a unique URI for the specific error; this will often point to an error log for that specific response."
}
```

Exemplu 1:

HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Content-Language: en

```json
{
    "type": "https://example.net/validation-error",
    "title": "Your request parameters didn't validate.",
    "status": 400,
    "invalid-params": [
        {
            "name": "age",
            "reason": "must be a positive integer"
        },
        {
            "name": "color",
            "reason": "must be 'green', 'red' or 'blue'"
        }
    ]
}
```

Exemplu 2:

HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Content-Language: en

```json
{
    "type": "https://example.com/probs/out-of-credit",
    "title": "You do not have enough credit.",
    "status": 403,
    "detail": "Your current balance is 30, but that costs 50.",
    "instance": "/account/12345/msgs/abc",
    "balance": 30,
    "accounts": ["/account/12345", "/account/67890"]
}
```

Exemplu 3:

```json
{
    "type": "https://example.com/problems/request-parameters-missing",
    "title": "required parameters are missing",
    "detail": "The parameters: limit, date were not provided",
    "limit_parameter_format": "number",
    "date_parameter_format": "YYYY-mm-ddThh:mm-ss"
}``
```

## Rezultatul deciziei

Aleg rfc 7807, pentru ca este un standard conceput special pt. acest scop (si singurul), cu o notorietate in crestere.

Exemple concrete:

```json
{
    "type": "https://example.com/problems/page-not-found",
    "title": "Pagina negasita",
    "status": 404
}
```

```json
{
    "type": "https://example.net/validation-error",
    "title": "Cerere invalida",
    "status": 422,
    "invalid-params": [
        {
            "name": "age",
            "reason": "trebuie sa fie un numar intreg"
        },
        {
            "name": "color",
            "reason": "trebuie sa fie 'verde', 'rosu' or 'albastru'"
        }
    ]
}
