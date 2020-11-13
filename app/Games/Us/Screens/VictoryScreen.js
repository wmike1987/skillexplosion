import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import Scene from '@core/Scene.js'
import styles from '@utils/Styles.js'

//Stat titles
var kills = "Kills";
var deaths = "Deaths";
var damageDone = "Damage Done";
var damageTaken = "Damage Taken";
var healingDone = "Healing Done";
var preventedArmorDamage = "Damage Prevented By Armor";
var groundCovered = "Distance Covered";
var apm = "APM";
var titleStyle = styles.statTitleStyle;
var statStyle = styles.statTextStyle;
var statDividerStyle = styles.statDividerStyle;
var unitGeneralStyle = styles.unitGeneralStyle;
var unitDamageStyle = styles.unitDamageStyle;
var unitDefenseStyle = styles.unitDefenseStyle;

//Shane titles
var shaneTitle = "Shane";
var knivesThrown = "Knives Thrown";
var dashesPerformed = "Dashes Performed";

//Ursula titles
var ursulaTitle = "Ursula";
var minesLaid = "Mines Laid";
var secretStepsPerformed = "Secret Steps Performed";

var VictoryScreen = function(units, statsObj) {
    var shane = units.shane;
    var ursula = units.ursula;
    var shaneStats = statsObj.shane.getStatMap();
    var ursulaStats = statsObj.ursula.getStatMap();

    //Global vars
    var startY = gameUtils.getCanvasHeight()/15;
    var yIncrement = gameUtils.getCanvasHeight()/15;
    var stage = "hudText";
    var healthEnergyXOffset = 43;
    var unitStatYSpacing = 20;

    //Shane vars
    var shaneColumnX = gameUtils.getPlayableWidth()/4;

    //Ursula vars
    var ursColumnX = gameUtils.getPlayableWidth()*3/4;

    var shaneBasePosition = {x: shaneColumnX, y: startY};
    var ursulaBasePosition = {x: ursColumnX, y: startY};

    //Convience position creators
    var same = 0;
    var title = 22;
    var portrait = 55;
    var reg = 15;
    var divider = 25;

    var shaneY = 0;
    var shanePosition = function(type) {
        var r = mathArrayUtils.clonePosition(shaneBasePosition, {y: shaneY});
        shaneY += type;
        return r;
    }

    var ursulaY = 0;
    var ursulaPosition = function(type) {
        var r = mathArrayUtils.clonePosition(ursulaBasePosition, {y: ursulaY});
        ursulaY += type;
        return r;
    }

    this.shaneStats = [];
    this.ursulaStats = [];
    this.createScene = function() {
        var scene = new Scene();
        scene.addBlackBackground();

        var skinnyDivider = '———————';
        var divider = '———————————';

        //Shane
        var startPos = shanePosition(same);
        startPos.x -= 43;
        var marinePortrait = graphicsUtils.createDisplayObject('MarinePortrait', {position: startPos, where: stage});
        var marinePortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {position: shanePosition(portrait), where: stage});
        var marineHealth = graphicsUtils.createDisplayObject("TEXT:" + "💗 " + shane.maxHealth, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY - unitStatYSpacing*1.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineEnergy = graphicsUtils.createDisplayObject("TEXT:" + "🔹 " + shane.maxEnergy, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY - unitStatYSpacing*.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineDamage = graphicsUtils.createDisplayObject("TEXT:" + "Dmg: " + shane.damage, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY + unitStatYSpacing*.5}, style: unitDamageStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineDefense = graphicsUtils.createDisplayObject("TEXT:" + "Def: " + shane.defense, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY + unitStatYSpacing*1.5}, style: unitDefenseStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var placeholder = graphicsUtils.createDisplayObject("TEXT:" + skinnyDivider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(marinePortraitBorder, 0x18bb96, 0xa80505, 6000);
        this.shaneStats.push([marinePortrait, marinePortraitBorder, placeholder, marineHealth, marineEnergy, marineDamage, marineDefense]);

        var shaneKillsTitle = graphicsUtils.createDisplayObject("TEXT:" + kills, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneKills = graphicsUtils.createDisplayObject("TEXT:" + shaneStats.kills, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneKillsTitle, shaneKills, placeholder]);

        var shaneDamageTitle = graphicsUtils.createDisplayObject("TEXT:" + damageDone, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamage = graphicsUtils.createDisplayObject("TEXT:" + shaneStats.damageDone, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTitle, shaneDamage, placeholder]);

        var shaneDamageTakenTitle = graphicsUtils.createDisplayObject("TEXT:" + damageTaken, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamageTaken = graphicsUtils.createDisplayObject("TEXT:" + shaneStats.damageTaken, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTakenTitle, shaneDamageTaken, placeholder]);

        var shaneHealingDoneTitle = graphicsUtils.createDisplayObject("TEXT:" + healingDone, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneHealingDone = graphicsUtils.createDisplayObject("TEXT:" + shaneStats.healingDone, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneHealingDoneTitle, shaneHealingDone, placeholder]);

        //Ursula
        var startPos = ursulaPosition(same);
        startPos.x -= 43;
        var medicPortrait = graphicsUtils.createDisplayObject('MedicPortrait', {position: startPos, where: stage});
        var medicPortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {position: ursulaPosition(portrait), where: stage});
        var medicHealth = graphicsUtils.createDisplayObject("TEXT:" + "💗 " + ursula.maxHealth, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY - unitStatYSpacing*1.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicEnergy = graphicsUtils.createDisplayObject("TEXT:" + "🔹 " + ursula.maxEnergy, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY - unitStatYSpacing*.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicDamage = graphicsUtils.createDisplayObject("TEXT:" + "Heal: " + ursula.damageMember(), {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY + unitStatYSpacing*.5}, style: unitDamageStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicDefense = graphicsUtils.createDisplayObject("TEXT:" + "Def: " + ursula.defense, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY + unitStatYSpacing*1.5}, style: unitDefenseStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + skinnyDivider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(medicPortraitBorder, 0x18bb96, 0x20902f, 6000);
        this.ursulaStats.push([medicPortrait, medicPortraitBorder, placeholder, medicHealth, medicEnergy, medicDamage, medicDefense]);

        var ursulaKillsTitle = graphicsUtils.createDisplayObject("TEXT:" + kills, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaKills = graphicsUtils.createDisplayObject("TEXT:" + ursulaStats.kills, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaKillsTitle, ursulaKills, placeholder]);

        var ursulaDamageTitle = graphicsUtils.createDisplayObject("TEXT:" + damageDone, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamage = graphicsUtils.createDisplayObject("TEXT:" + ursulaStats.damageDone, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTitle, ursulaDamage, placeholder]);

        var ursulaDamageTakenTitle = graphicsUtils.createDisplayObject("TEXT:" + damageTaken, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamageTaken = graphicsUtils.createDisplayObject("TEXT:" + ursulaStats.damageTaken, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTakenTitle, ursulaDamageTaken, placeholder]);

        var ursulaHealingDoneTitle = graphicsUtils.createDisplayObject("TEXT:" + healingDone, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaHealingDone = graphicsUtils.createDisplayObject("TEXT:" + ursulaStats.healingDone, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaHealingDoneTitle, ursulaHealingDone, placeholder]);

        //Add everything to the scene
        this.shaneStats.forEach((objArr) => {
            objArr.forEach((obj) => {
                scene.add(obj);
            })
        })

        this.ursulaStats.forEach((objArr) => {
            objArr.forEach((obj) => {
                scene.add(obj);
            })
        })
        return scene;
    };

    this.initialize = function() {

    };
}

export default VictoryScreen;
