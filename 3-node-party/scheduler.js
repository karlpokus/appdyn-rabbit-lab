const appd = require('../lib/agent').start('scheduler');
const amqp = require('amqplib');

const q = 'appdyn-test';
let i = 0;

function publishTasks(ch) {
	console.log('adding to queue');

	const txn = appd.startTransaction('/scheduler');

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
}

amqp.connect('amqp://localhost')
  .then(conn => conn.createChannel())
  .then(ch => ch.assertQueue(q)
    .then(ok => setInterval(publishTasks.bind(null, ch), 10000))
  )
  .catch(console.warn);
