const appd = require('../lib/agent').start('consumer');

const amqp = require('amqplib');
const http = require('http');

const arbitraryRemoteCall = cb => {
	http.get('http://jsonplaceholder.typicode.com/posts/1', cb);
}

const q = 'appdyn-test';

function logger(msg) {
	const ch = this;

	if (msg) {
		const content = JSON.parse(msg.content.toString());
		console.log(`got a msg. Starting remote call`);

		const txn = appd.startTransaction(appd.parseCorrelationInfo(content.singularityheader));

		arbitraryRemoteCall(() => {
			console.log('remote call done');
			txn.end();
			ch.ack(msg);
		});
	}
}

amqp.connect('amqp://localhost')
  .then(conn => conn.createChannel())
  .then(ch => ch.assertQueue(q)
    .then(ok => ch.consume(q, logger.bind(ch)))
  )
  .catch(console.warn);
