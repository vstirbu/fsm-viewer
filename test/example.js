/*global module, require */
module.exports = function (app) {
  var uuid = require('node-uuid'),
      debug = require('debug')('airscore:match:team-sparring'),
      fsm = require('fsm-as-promised'),
      minuteLength = app.constants.time.minute;

  return function (options, ring) {
    var flow = [
          'Bout 1',       // 0
          'Break',        // 1
          'Bout 2',       // 2
          'Break',        // 3
          'Bout 3',       // 4
          'Break',        // 5
          'Bout 4',       // 6
          'Break',        // 7
          'Bout 5',       // 8
          'Extra Bout',   // 9
          'First Point'   // 10
        ],
        flowIndex = 0,
        state;

    state = fsm({
      initial: 'new',
      final: 'complete',
      events: [
        //NOTE: Bout 1
        { name: 'start', from: 'new', to: 'Round1' },
        { name: 'pause', from: 'Round1', to: 'Pause' },

        //NOTE: Same for all bouts
        { name: 'medicpause', from: 'Pause', to: 'MedicPause' },
        { name: 'medicresume', from: 'MedicPause', to: 'Pause' },
        { name: 'resume', from: 'Pause',
          to: ['Round1', 'Round2', 'Round3', 'Round4', 'Round5', 'Extratime', 'SuddenDeath'],
          condition: resume
        },

        { name: 'end', from: 'Round1', to: 'WaitBreak1' },

        { name: 'score', from: 'Round1' },
        { name: 'score', from: 'Pause' },

        //NOTE: Break 1
        { name: 'start', from: 'WaitBreak1', to: 'Break1' },
        { name: 'end', from: 'Break1', to: 'WaitRound2' },

        //NOTE: Bout 2
        { name: 'start', from: 'WaitRound2', to: 'Round2' },
        { name: 'pause', from: 'Round2', to: 'Pause' },
        { name: 'end', from: 'Round2', to: 'WaitBreak2' },

        { name: 'score', from: 'Round2' },

        //NOTE: Break 2
        { name: 'start', from: 'WaitBreak2', to: 'Break2' },
        { name: 'end', from: 'Break2', to: 'WaitRound3' },

        //NOTE: Bout 3
        { name: 'start', from: 'WaitRound3', to: 'Round3' },
        { name: 'pause', from: 'Round3', to: 'Pause' },
        { name: 'end', from: 'Round3', to: 'WaitBreak3' },

        { name: 'score', from: 'Round3' },

        //NOTE: Break 3
        { name: 'start', from: 'WaitBreak3', to: 'Break3' },
        { name: 'end', from: 'Break3', to: 'WaitRound4' },

        //NOTE: Bout 4
        { name: 'start', from: 'WaitRound4', to: 'Round4' },
        { name: 'pause', from: 'Round4', to: 'Pause' },
        { name: 'end', from: 'Round4', to: 'WaitBreak4' },

        { name: 'score', from: 'Round4' },

        //NOTE: Break 4
        { name: 'start', from: 'WaitBreak4', to: 'Break4' },
        { name: 'end', from: 'Break4', to: 'WaitRound5' },

        //NOTE: Bout 5
        { name: 'start', from: 'WaitRound5', to: 'Round5' },
        { name: 'pause', from: 'Round5', to: 'Pause' },
        { name: 'end', from: 'Round5',
          to: ['WaitExtratime', 'complete'],
          condition: continueOrComplete
        },

        { name: 'score', from: 'Round5' },

        //NOTE: Extratime
        { name: 'start', from: 'WaitExtratime', to: 'Extratime' },
        { name: 'pause', from: 'Extratime', to: 'Pause' },
        { name: 'end', from: 'Extratime',
          to: ['WaitSuddenDeath', 'complete'],
          condition: continueOrComplete
        },

        { name: 'score', from: 'Extratime' },

        //NOTE: SuddenDeath
        { name: 'start', from: 'WaitSuddenDeath', to: 'SuddenDeath' },
        { name: 'pause', from: 'SuddenDeath', to: 'Pause' },
        { name: 'check', from: 'SuddenDeath',
          to: ['SuddenDeath', 'complete'],
          condition: continueOrComplete
        },

        { name: 'score', from: 'SuddenDeath' },

        //NOTE: Decisions from now on
        { name: 'Disqualification', from: 'MedicPause',
          to: ['WaitBreak1', 'WaitBreak2', 'WaitBreak3', 'WaitBreak4', 'WaitExtratime', 'complete'],
          condition: waitBreakOrComplete
        },

        { name: 'Injury', from: 'MedicPause',
          to: ['WaitBreak1', 'WaitBreak2', 'WaitBreak3', 'WaitBreak4', 'WaitExtratime', 'complete'],
          condition: waitBreakOrComplete
        },

        { name: 'Withdraw', from: 'Pause',
          to: ['WaitBreak1', 'WaitBreak2', 'WaitBreak3', 'WaitBreak4', 'WaitExtratime', 'complete'],
          condition: waitBreakOrComplete
        },

        { name: 'ThirdFoul', from: 'Round1', to: 'WaitBreak1' },
        { name: 'ThirdFoul', from: 'Round2', to: 'WaitBreak2' },
        { name: 'ThirdFoul', from: 'Round3', to: 'WaitBreak3' },
        { name: 'ThirdFoul', from: 'Round4', to: 'WaitBreak4' },
        { name: 'ThirdFoul', from: 'Round5',
          to: ['WaitExtratime', 'complete'],
          condition: continueOrComplete
        },
        { name: 'ThirdFoul', from: 'Extratime', to: 'complete' },
        { name: 'ThirdFoul', from: 'SuddenDeath', to: 'complete' },

        { name: 'ThirdFoul', from: 'Pause',
          to: ['WaitBreak1', 'WaitBreak2', 'WaitBreak3', 'WaitBreak4', 'WaitExtratime', 'complete'],
          condition: waitBreakOrComplete
        },

        { name: 'SkewTime', from: 'Pause' }
      ],
      callbacks: {
        onWithdraw: function (options) {
          ring.data.match.score.abandons[ring.data.match.index] = {
            reason: 'Withdraw',
            color: options.args[0]
          };
          ring.data.match.score.refreshLeader();
        },
        onInjury: function (options) {
          ring.data.match.score.abandons[ring.data.match.index] = {
            reason: 'Injury',
            color: options.args[0]
          };
          ring.data.match.score.refreshLeader();
        },
        onDisqualification: function (options) {
          ring.data.match.score.abandons[ring.data.match.index] = {
            reason: 'Disqualification',
            color: options.args[0]
          };
          ring.data.match.score.refreshLeader();
        },
        onThirdFoul: function (options) {
          var index = ring.data.match.index,
              user = options.args[1],
              point = options.args[0];

          if (user.data.type === 'umpire') {
            if (ring.data.pads[0].data.score.data[index][point.color].foul === 2) {
              ring.data.match.score.scoreOnUmpire(point, user, index);

              ring.data.match.score.abandons[index] = {
                reason: 'ThirdFoul',
                color: color
              };
              ring.data.match.score.refreshLeader();
            }
          }
        },
        onSkewTime: function (options) {
          var skew = options.args[0],
              newVal = ring.data.mainTimer.getValue() - skew * 1000;
          console.log('adjust time', skew);

          ring.data.mainTimer.reset(newVal > 0 ? newVal : 0);

          ring.data.umpire.message('mainTimerStart', Math.round(ring.data.mainTimer.getValue()/1000));
          ring.data.umpire.message('mainTimerStop');
          if (ring.data.tv) {
            ring.data.tv.message('mainTimerStart', Math.round(ring.data.mainTimer.getValue()/1000));
            ring.data.tv.message('mainTimerStop');
          }
        },
        onmatchwon: function () {
          // notify that match is won
          // save match result
          console.log('+++ match won');
          ring.data.umpire.message('matchWon');

          // stop main timer
          if (ring.data.tv) {
            ring.data.tv.message('mainTimerStop');
          }
          ring.data.umpire.message('mainTimerStop');

          deliverUpdatesOnDevices();
        },
        onstart: function (options) {
          console.log('starting the game');
          switch (options.to) {
          case 'Round1':
          case 'Round2':
          case 'Round3':
          case 'Round4':
          case 'Round5':
            ring.data.mainTimer.reset(ring.data.roundDuration * minuteLength * 1000);
            ring.data.mainTimer.sync(ring.data.umpire);
            ring.data.mainTimer.start();
            ring.data.umpire.message('mainTimerStart', ring.data.roundDuration * minuteLength);
            if (ring.data.tv){
              ring.data.tv.message('mainTimerStart', ring.data.roundDuration * minuteLength);
            }
            break;
          case 'Break1':
          case 'Break2':
          case 'Break3':
          case 'Break4':
            ring.data.mainTimer.reset(0 * 60 * 1000);
            ring.data.mainTimer.sync(ring.data.umpire);
            ring.data.mainTimer.start();
            //NOTE controls the break length
            ring.data.umpire.message('mainTimerStart', 0);
            if (ring.data.tv) {
              //NOTE controls the break length
              ring.data.tv.message('mainTimerStart', 0);
            }
            break;
          case 'Extratime':
            // default time for extratime is 1 min
            ring.data.mainTimer.reset(1 * 60 * 1000);
            ring.data.mainTimer.sync(ring.data.umpire);
            ring.data.mainTimer.start();
            //NOTE controls the break length
            ring.data.umpire.message('mainTimerStart', 1 * minuteLength);
            if (ring.data.tv) {
              //NOTE controls the break length
              ring.data.tv.message('mainTimerStart', 1 * minuteLength);
            }
            break;
          default:
          }
        },
        onpause: function (options) {
          console.log('pausing the game');
          ring.data.mainTimer.stop();
          ring.data.umpire.message('mainTimerStop');
          if (ring.data.tv) {
            ring.data.tv.message('mainTimerStop');
          }
        },
        onresume: function (options) {
          console.log('resuming the game');
          ring.data.mainTimer.start();
          ring.data.umpire.message('mainTimerStart', Math.round(ring.data.mainTimer.getValue()/1000));
          if (ring.data.tv) {
            ring.data.tv.message('mainTimerStart', Math.round(ring.data.mainTimer.getValue()/1000));
          }
        },
        onend: function (options) {
          //TODO: investigate if can be removed
          ring.data.umpire.message('mainTimerStop');
          if (ring.data.tv) {
            ring.data.tv.message('mainTimerStop');
          }

          deliverUpdatesOnDevices();

          switch (options.to) {
            case 'WaitBreak1':
            case 'WaitBreak2':
            case 'WaitBreak3':
            case 'WaitBreak4':
            case 'WaitExtratime':
              resetMainTimer(0);
              break;
            default:
          }

          switch (options.from) {
            case 'Break1':
            case 'Break2':
            case 'Break3':
            case 'Break4':
              resetMainTimer(ring.data.roundDuration);
              break;
            default:
          }
        },
        onadjustclock: function (options) {
          var millis = options.args[0],
              mode = options.args[1],
              current;

          ring.data.mainTimer.stop();
          current = ring.data.mainTimer.getValue();

          switch (mode) {
            case 'inc':
              ring.data.mainTimer.reset(current + millis);
              break;
            case 'dec':
              ring.data.mainTimer.reset(current - millis);
              break;
            default:
          }

          ring.data.mainTimer.start();
        },
        onscore: function (options) {
          var index = ring.data.match.index,
              user = options.args[1],
              point = options.args[0];

          switch (options.from) {
            case 'Pause':
              if (user.data.type === 'pad') {
                throw new Error('Not allowed');
              }
              break;
            default:
          }

          switch (user.data.type) {
            case 'pad':
              ring.data.match.score.scoreOnPad(point, user, index);

              // return result for scoring pad
              options.res = {
                match: ring.data.match,
                score: user.data.score
              };
              break;
            case 'umpire':
              ring.data.match.score.scoreOnUmpire(point, user, index);

              // return result for umpire
              options.res = {
                match: ring.data.match,
                score: ring.data.match.score
              };
              break;
            default:
          }
        },
        onenterMedicPause: function (options) {
          ring.data.medicTimer.reset(3 * minuteLength * 1000);
          ring.data.medicTimer.start();

          ring.data.umpire.message('medicTimerStart', 3 * minuteLength);
          if (ring.data.tv) {
            ring.data.tv.message('medicTimerStart', {
              duration: 3 * minuteLength,
              color: options.args[0].color
            });
          }
        },
        onleaveMedicPause: function leaveMedicPause() {
          ring.data.medicTimer.stop();
          ring.data.umpire.message('medicTimerStop');
          if (ring.data.tv) {
            ring.data.tv.message('medicTimerStop');
          }
        },
        onleaveRound1: leaveRound,
        onenterWaitBreak1: onenterWaitBreak,
        onenterWaitRound2: onenterWaitRound,
        onleaveRound2: leaveRound,
        onenterWaitBreak2: onenterWaitBreak,
        onenterWaitRound3: onenterWaitRound,
        onleaveRound3: leaveRound,
        onenterWaitBreak3: onenterWaitBreak,
        onenterWaitRound4: onenterWaitRound,
        onleaveRound4: leaveRound,
        onenterWaitBreak4: onenterWaitBreak,
        onenterWaitRound5: onenterWaitRound,
        onleaveRound5: leaveRound,
        onenterWaitExtratime: function enterWaitExtratime(options) {
          flowIndex++;
          insertData();

          options.res = {
            next: 'boutWon',
            match: ring.data.match,
            score: ring.data.match.score
          };
        },
        onenterWaitSuddenDeath: function enterWaitSuddenDeath(options) {
          flowIndex++;
          insertData();

          options.res = {
            next: 'boutWon',
            match: ring.data.match,
            score: ring.data.match.score
          };

          if (ring.data.tv) {
            ring.data.tv.message('mainTimerHide');
          }
        },
        onenterSuddenDeath: function enterSuddenDeath(options) {
          if (options.name === 'check') {
            insertData();

            deliverUpdatesOnDevices();
          }
        },
        onentercomplete: function onentercomplete() {
          options.res = {
            next: 'matchWon',
            match: ring.data.match,
            score: ring.data.match.score
          };

          ring.data.umpire.message('matchWon');
        },
        onentered: function (options) {
          //debug(`${options.name}:${options.from}->${options.to}`);
        },
        onenteredcomplete: function onenteredcomplete() {
          var score = ring.data.match.score.toJSON(),
              now = new Date();

          score.ring = ring.id;
          score.match = ring.data.match.id;
          score.team = ring.data.team;
          score.type = ring.data.type;
          score.finishedAt = now.toISOString();

          app.dbs.scores.insert(score, function (err, doc) {
            console.log('saved', doc);
          });
        },
      }
    });

    function leaveRound() {
      ring.data.mainTimer.stop();
      ring.data.umpire.message('mainTimerStop');
      if (ring.data.tv) {
        ring.data.tv.message('mainTimerStop');
      }
    }

    function onenterWaitBreak(options) {
      flowIndex++;

      options.res = {
        next: 'boutWon',
        match: ring.data.match,
        score: ring.data.match.score
      };
    }

    function onenterWaitRound(options) {
      flowIndex++;
      insertData();
    }

    function waitBreakOrComplete() {
      switch (flowIndex) {
        case 0:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 6:
          return 3;
        case 8:
          return 4;
        default:
          return 5;
      }
    }

    function resume() {
      switch (flowIndex) {
        case 0:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 6:
          return 3;
        case 8:
          return 4;
        case 10:
          return 5;
        default:
          return 6;
      }
    }

    function continueOrComplete () {
      if (ring.data.match.score.leader === 'draw') {
        return 0;
      } else {
        return 1;
      }
    }

    function resetMainTimer (duration) {
      if (ring.data.tv) {
        ring.data.tv.message('mainTimerShow');
        ring.data.tv.message('mainTimerStart', duration * minuteLength);
        ring.data.tv.message('mainTimerStop');
      }
      ring.data.umpire.message('mainTimerStart', duration * minuteLength);
      ring.data.umpire.message('mainTimerStop');
    }

    function insertData () {
      ring.data.match.index++;
      ring.data.match.score.addPadsData();
    }

    function deliverUpdatesOnDevices () {
      // update pads for delivery
      ring.data.match.score.touchPads();

      // update delivery for umpire and TV
      ring.data.match.score.touchUmpire();
      if (ring.data.tv) {
        ring.data.match.score.touchTv();
      }
    }

    resetMainTimer(ring.data.roundDuration);

    return {
      id: uuid.v4(),
      // proper name for periods is bouts
      periods: 5,
      score: app.lib.score.team.sparring(ring),
      state: state,
      index: 0,
      toJSON: function() {
        return {
          //The JSON object representing the match object
          id: this.id,
          index: this.index,
          periods: this.periods,
          label: flow[flowIndex],
          flowIndex: flowIndex,
          thirdFoulWarning: {
            red: ring.data.pads[0].data.score.data[this.index].red.foul === 2,
            blue: ring.data.pads[0].data.score.data[this.index].blue.foul === 2
          }
        };
      }
    };
  };
};
