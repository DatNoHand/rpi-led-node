/**
  * Returns a list of all available modes
  * Key = GamemodeID
  * Value = Filename in config/modes/
  @author Gabriel Selinschek
*/
var modes = {
  1: {
    'id': 1,
    'name_short': 'ffa',
    'name_long': 'Steurers Buttercrossaint',
    'desc': 'Kill all enemies'
  },
  2: {
    'id': 2,
    'name_short': 'tdm',
    'name_long': 'Team Deathmatch',
    'desc': 'Work together and kill the enemy Team'
  }
}

// Leave that as-is
module.exports = modes;
