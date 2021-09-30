interface DigitalHubApiConstructorOptions {
	username: string;
	password: string;
	tenant: string;
}

interface DigitalHubApiCallOptions {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: any;
	qs?: object;
	json?: boolean;
}

export default class DigitalHubApi {
	constructor(options: DigitalHubApiConstructorOptions);
	api(options: DigitalHubApiCallOptions): Promise<Response | Object>;
}
