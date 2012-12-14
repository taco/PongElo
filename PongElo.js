Matches = new Meteor.Collection("matches");
Players = new Meteor.Collection("players");

Matches.allow({
  insert: function (userId, doc) {
    doc.t = Date.now();
    doc.wOldScore = getOldScore(doc.winner);
    doc.lOldScore = getOldScore(doc.loser);

    doc.wChance = calculateChance(doc.wOldScore, doc.lOldScore);
    doc.lChance = 1 - doc.wChance;

    doc.wNewScore = getNewScore(doc.wOldScore, doc.wChance, true);
    doc.lNewScore = getNewScore(doc.lOldScore, doc.lChance, false);

    updatePlayerScore(doc.winner, doc.wNewScore);
    updatePlayerScore(doc.loser, doc.lNewScore);

    if (doc.winner2 === '' || doc.loser2 === '') {
      doc.winner2 = undefined;
      doc.loser2 = undefined;

      return true;
    }

    doc.wOldScore2 = getOldScore(doc.winner2);
    doc.lOldScore2 = getOldScore(doc.loser2);
    
    doc.wChance = calculateChance((doc.wOldScore + doc.wOldScore2)/2, (doc.lOldScore + doc.lOldScore2)/2);
    doc.lChance = 1 - doc.wChance;

    doc.wChance2 = doc.wChance;
    doc.lChance2 = doc.lChance2;

    doc.wNewScore = getNewScore(doc.wOldScore, doc.wChance, true);
    doc.lNewScore = getNewScore(doc.lOldScore, doc.lChance, false);

    doc.wNewScore2 = getNewScore(doc.wOldScore2, doc.wChance, true);
    doc.lNewScore2 = getNewScore(doc.lOldScore2, doc.lChance, false);

    updatePlayerScore(doc.winner, doc.wNewScore);
    updatePlayerScore(doc.loser, doc.lNewScore);

    updatePlayerScore(doc.winner2, doc.wNewScore2);
    updatePlayerScore(doc.loser2, doc.lNewScore2);

    return true;
  },

  remove: function (userId, doc) {
    return true;
  }
});

updatePlayerScore = function (name, score) {
  Players.update({name: name}, {$set: {score: score}});
};


calculateChance = function (playerScore, opponentScore) {
  return 1 / (1 + Math.pow(10, (opponentScore - playerScore)/400));
};

getOldScore = function (name) {
  //return 1200;
  // var results = Matches.find({
  //   $or: [
  //     {winner: name},
  //     {winner2: name},
  //     {loser: name},
  //     {loser2: name}
  //   ]
  // }, {sort: {t: -1}, limit: 1}).fetch();

  // if (results.length !== 1) {
  //   return 1200;
  // }

  // if (results[0].winner === name) {
  //   return results[0].wNewScore;
  // }

  // if (results[0].loser === name) {
  //   return results[0].lNewScore;
  // }

  // if (results[0].winner2 === name) {
  //   return results[0].wNewScore2;
  // }

  // if (results[0].loser2 === name) {
  //   return results[0].lNewScore2;
  // }

  var results = Players.find({name: name}, {limit: 1}).fetch();

  if (results.length === 1) {
    return results[0].score;
  }

  return 1200;
};

getNewScore = function (oldScore, chance, won) {
  return oldScore + 32 * ((won ? 1 : 0) - chance);
};

if (Meteor.isClient) {
  
  Meteor.subscribe("matches");
  Meteor.subscribe("players");

  Template.hello.greeting = function () {
    return "Welcome to test.";
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });

  Template.rankings.players = function () {
    return Players.find({},{sort: {score: -1}}).fetch();
  };

  Template.rankings.events({
    'click #addPlayer': function () {
      Players.insert({
        name: $('input[type="text"]').val(),
        score: 1200
      });

      $('input[type="text"]').val('');
    }
  });

  Template.matches.matches = function () {
    return Matches.find({
      winner: {$ne: undefined},
      loser: {$ne: undefined}
    }, {sort: {t: -1}}).fetch();
  };

  Template.matches.events({
    'click #addMatch': function () {
      console.log('clicked the button!');

      Matches.insert({
        winner: $('#winner').val(),
        loser: $('#loser').val(),
        winner2: $('#winner2').val(),
        loser2: $('#loser2').val()
      });

      $('select').val('');
    }
  });

  Template.players.players = function () {
    return Players.find({
      name: {$ne: undefined}
    }).fetch();
  };

  Handlebars.registerHelper("formatPercent", function (percent) {
    return Math.round(percent * 100, 2) + '%';
  });

  Handlebars.registerHelper("formatScore", function (score) {
    return Math.round(score);
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
