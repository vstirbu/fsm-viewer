const fsm = require('fsm-as-promised');

fsm({
  initial: 'new',
  final: ['end'],
  events: [
    { name: 'start', from: 'new', to: 'round' },
    {
      name: 'end',
      from: 'round',
      to: ['extratime', 'end'],
      condition: () => {}
    },
    { name: 'end', from: 'extratime', to: 'end' }
  ],
  callbacks: {
    onenterround: () => {}
  }
});
