import config from 'config';
import { authHeader } from './auth-header';

export const userService = {
    login,
    logout,
    setScore
};

function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    };

    return fetch(`${config.apiUrl}/auth/sign-in`, requestOptions)
        .then(handleResponse)
        .then(token => {
            // login successful if there's a user in the response
            if (token) {
                localStorage.setItem('token', JSON.stringify(token.accessToken));
                const requestOptions = {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token.accessToken }
                }
                return fetch(`${config.apiUrl}/api/profile`, requestOptions)
                    .then(handleResponse)
                    .then(user => {
                        // add to user token
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                );

            }

            return token;
        });
}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
}

function setScore(score) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ score })
    };

    return fetch(`${config.apiUrl}/api/setscore`, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}
