# Samples

To run the examples please put your credentials in a `.env` file in the samples folder root. Please include the following properties.

	DH_TENANT='mydigitalhub.5app.com'
	DH_USERNAME='andrew@5app.com'
	DH_PASSWORD='mysecretpassword'

Then the samples may be executed with these Environment Variables using the node option **require** `-r dotenv/config` [dotenv](https://www.npmjs.com/package/dotenv)

E.g.

	node -r dotenv/config report/report.js playlist-popularity

Open the sample directories to see the options for running each one.