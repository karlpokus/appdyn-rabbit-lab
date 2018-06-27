const appd = require('../lib/agent').start('http-producer');
const amqp = require('amqplib');
const http = require('http');

const q = 'appdyn-test';
let i = 0;

function connectToRabbit(next) {
	amqp.connect('amqp://localhost')
	  .then(conn => conn.createChannel())
	  .then(ch => ch.assertQueue(q)
			.then(ok => next(ch))
	  )
	  .catch(console.warn);
}

function publish(ch, req, res) {
	console.log('got request. Adding to queue');

	const txn = appd.getTransaction(req);
	const exitCall = txn.startExitCall({
		exitType: 'EXIT_RABBITMQ',
		label: 'rabbitmq',
		name: 'rabbitmq',
		backendName: 'rabbitmq',
		identifyingProperties: {
			Host: 'localhost',
			Port: '5672'
		}
	});
	const msg = {
		data: `task ${ ++i }`,
		singularityheader: txn.createCorrelationInfo(exitCall, true)
	};
  ch.sendToQueue(q, Buffer.from(JSON.stringify(msg)));
	txn.endExitCall(exitCall);
	txn.end();
	res.end();
}

function startServer(ch) {
	http.createServer()
		.on('request', publish.bind(null, ch))
		.listen(5005, () => console.log('http-producer running'));
}

connectToRabbit(startServer);
