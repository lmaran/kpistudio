// https://medium.com/yellowcode/download-api-files-with-react-fetch-393e4dae0d9e
export const fetchHelpers = {
    get: async url => {
        const config = {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const response = await fetch(url, config);
        if (response.ok) {
            return response.json(); // it returns a Promise here, not a concrete object
        }
        // if an errors, anything but 200 then reject with the actual response
        return Promise.reject(response);
    },
    post: async (url, data) => {
        const config = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data) // data can be `string` or {object}!
        };
        const response = await fetch(url, config);
        if (response.ok) {
            // console.log(response);
            return response.json(); // it returns a Promise here, not a concrete object
        }
        // if an errors, anything but 200 then reject with the actual response
        return Promise.reject(response);
    },
    put: async (url, data) => {
        const config = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data) // data can be `string` or {object}!
        };
        const response = await fetch(url, config);
        // console.log(response);
        if (response.ok) {
            // console.log(response);
            if (response.status === 201) {
                if (response.bodyUsed) {
                    return response.json(); // it returns a Promise here, not a concrete object
                } else {
                    return null; // OK, but no content
                }
            }
            // TODO treat also other response codes: https://stackoverflow.com/a/827045
            // "409 Conflict" for a PUT that is unsuccessful due to a 3rd-party modification, with a list of differences
            // between the attempted update and the current resource in the response body

            // "400 Bad Request" for an unsuccessful PUT, with text in the response body that explains why the PUT failed

            // 201 Created" for a successful PUT of a new resource, with the most specific URI for the new resource returned
            // in the Location header field and any other relevant URIs and metadata of the resource echoed in the response body.
            return null; // OK, but no content
        }
        // if an errors, anything but 200 then reject with the actual response
        return Promise.reject(response);
    },
    delete: async url => {
        const config = {
            method: "DELETE"
        };
        const response = await fetch(url, config);
        if (response.ok && response.status === 204) {
            return null; // OK, but no content
        }
        // if an errors, then reject with the actual response
        return Promise.reject(response);
    }
};
