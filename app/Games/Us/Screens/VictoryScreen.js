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

//Shane titles
var shaneTitle = "Shane";
var knivesThrown = "Knives Thrown";
var dashesPerformed = "Dashes Performed";

//Ursula titles
var ursulaTitle = "Ursula";
var minesLaid = "Mines Laid";
var secretStepsPerformed = "Secret Steps Performed";

var VictoryScreen = function(statsObj) {
    Object.assign(this, statsObj);

    //Global vars
    var startY = gameUtils.getCanvasHeight()/15;
    var yIncrement = gameUtils.getCanvasHeight()/15;
    var stage = "hudText";

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
        var marinePortrait = graphicsUtils.createDisplayObject('MarinePortrait', {position: shanePosition(same), where: stage});
        var marinePortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {position: shanePosition(portrait), where: stage});
        var placeholder = graphicsUtils.createDisplayObject("TEXT:" + skinnyDivider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(marinePortraitBorder, 0x18bb96, 0xa80505, 6000);
        this.shaneStats.push([marinePortrait, marinePortraitBorder, placeholder]);

        var shaneKillsTitle = graphicsUtils.createDisplayObject("TEXT:" + kills, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneKills = graphicsUtils.createDisplayObject("TEXT:" + '14', {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneKillsTitle, shaneKills, placeholder]);

        var shaneDamageTitle = graphicsUtils.createDisplayObject("TEXT:" + damageDone, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamage = graphicsUtils.createDisplayObject("TEXT:" + '144', {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTitle, shaneDamage, placeholder]);

        var shaneDamageTakenTitle = graphicsUtils.createDisplayObject("TEXT:" + damageTaken, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamageTaken = graphicsUtils.createDisplayObject("TEXT:" + '144', {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTakenTitle, shaneDamageTaken, placeholder]);

        //Ursula
        var medicPortrait = graphicsUtils.createDisplayObject('MedicPortrait', {position: ursulaPosition(same), where: stage});
        var medicPortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {position: ursulaPosition(portrait), where: stage});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + skinnyDivider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(medicPortraitBorder, 0x18bb96, 0x20902f, 6000);
        this.ursulaStats.push([medicPortrait, medicPortraitBorder, placeholder]);

        var ursulaKillsTitle = graphicsUtils.createDisplayObject("TEXT:" + kills, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaKills = graphicsUtils.createDisplayObject("TEXT:" + '14', {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaKillsTitle, ursulaKills, placeholder]);

        var ursulaDamageTitle = graphicsUtils.createDisplayObject("TEXT:" + damageDone, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamage = graphicsUtils.createDisplayObject("TEXT:" + '144', {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTitle, ursulaDamage, placeholder]);

        var ursulaDamageTakenTitle = graphicsUtils.createDisplayObject("TEXT:" + damageTaken, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamageTaken = graphicsUtils.createDisplayObject("TEXT:" + '144', {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEXT:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTakenTitle, ursulaDamageTaken, placeholder]);

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
