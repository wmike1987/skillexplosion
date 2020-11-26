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
var unitDefenseAdditionsStyle = styles.unitDefenseAdditionsStyle;
var unitGeneralEnergyStyle = styles.unitGeneralEnergyStyle;

//Shane titles
var shaneTitle = "Shane";
var knivesThrownKilled = "Knife Throws/Kills";
var dashesPerformed = "Dashes Performed";

//Ursula titles
var ursulaTitle = "Ursula";
var minesLaid = "Mines Laid";
var secretStepsPerformed = "Secret Steps";

var createContainer = function() {
    var container = new PIXI.Container();
    var left = graphicsUtils.createDisplayObject('Container1Left', {where: 'hudText', position: {x: -44, y: 0}});
    var right = graphicsUtils.createDisplayObject('Container1Right', {where: 'hudText', position: {x: 44, y: 0}});
    container.addChild(left);
    container.addChild(right);
    return container;
}

var VictoryScreen = function(units, statsObj) {
    if(false) {
        units = units || {
            shane: {},
            ursula: {}
        },
        statsObj = statsObj || {
            shane: {getStatMap: function() {
                return {};
            }},
            ursula: {getStatMap: function() {
                return {};
            }}
        }
    }

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
        var marineHealth = graphicsUtils.createDisplayObject("TEX+:" + "HP: " + shane.maxHealth, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY - unitStatYSpacing*1.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineEnergy = graphicsUtils.createDisplayObject("TEX+:" + "E: " + shane.maxEnergy, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY - unitStatYSpacing*.5}, style: unitGeneralEnergyStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineDamage = graphicsUtils.createDisplayObject("TEX+:" + "Dmg: " + shane.damage, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY + unitStatYSpacing*.5}, style: unitDamageStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var marineDefense = graphicsUtils.createDisplayObject("TEX+:" + "Def: " + shane.defense, {position: {x: shaneColumnX + healthEnergyXOffset, y: shaneY + unitStatYSpacing*1.5}, style: unitDefenseStyle, where: "hudText", anchor: {x: .5, y: .5}});

        var defenseAdditionText = '';
        if(shane.defenseAdditions.length > 0) {
            var sign = '+';
            if(shane.getDefenseAdditionSum() < 0) {
                sign = '';
            }
            defenseAdditionText = sign + shane.getDefenseAdditionSum();
        }
        var marineDefenseAdditions = graphicsUtils.createDisplayObject("TEX+:" + defenseAdditionText, {position: {x: shaneColumnX + healthEnergyXOffset + marineDefense.width/2, y: shaneY + unitStatYSpacing*1.5}, style: unitDefenseAdditionsStyle, where: "hudText", anchor: {x: .5, y: .5}});
        if(defenseAdditionText != '') {
            marineDefense.position.x -= marineDefenseAdditions.width/2;
        }

        var placeholder = graphicsUtils.createDisplayObject("TEX+:" + skinnyDivider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(marinePortraitBorder, 0x18bb96, 0xa80505, 6000);
        this.shaneStats.push([marinePortrait, marinePortraitBorder, placeholder, marineHealth, marineEnergy, marineDamage, marineDefense, marineDefenseAdditions]);

        var shaneKillsTitle = graphicsUtils.createDisplayObject("TEX+:" + kills, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        // graphicsUtils.addSomethingToRenderer(createContainer(), {where: 'hudText', position: shanePosition(same)});
        var shaneKills = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.kills, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneKillsTitle, shaneKills, placeholder]);

        var shaneDamageTitle = graphicsUtils.createDisplayObject("TEX+:" + damageDone, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamage = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageDone, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTitle, shaneDamage, placeholder]);

        var shaneDamageTakenTitle = graphicsUtils.createDisplayObject("TEX+:" + damageTaken, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageTaken, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageTakenTitle, shaneDamageTaken, placeholder]);

        var shaneDamageReducedByAmorTitle = graphicsUtils.createDisplayObject("TEX+:" + preventedArmorDamage, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageReducedByArmor, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDamageReducedByAmorTitle, shaneDamageReducedByAmor, placeholder]);

        var shaneHealingDoneTitle = graphicsUtils.createDisplayObject("TEX+:" + healingDone, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneHealingDone = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.healingDone, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneHealingDoneTitle, shaneHealingDone, placeholder]);

        var shaneKnifeTitle = graphicsUtils.createDisplayObject("TEX+:" + knivesThrownKilled, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneKnifeStats = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.knivesThrown + "/" + shaneStats.knifeKills, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneKnifeTitle, shaneKnifeStats, placeholder]);

        var shaneDashTitle = graphicsUtils.createDisplayObject("TEX+:" + dashesPerformed, {position: shanePosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var shaneDashesPerformed = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.dashesPerformed, {position: shanePosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: shanePosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.shaneStats.push([shaneDashTitle, shaneDashesPerformed, placeholder]);

        //Ursula
        var startPos = ursulaPosition(same);
        startPos.x -= 43;
        var medicPortrait = graphicsUtils.createDisplayObject('MedicPortrait', {position: startPos, where: stage});
        var medicPortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {position: ursulaPosition(portrait), where: stage});
        var medicEnergy = graphicsUtils.createDisplayObject("TEX+:" + "E: " + ursula.maxEnergy, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY - unitStatYSpacing*.5}, style: unitGeneralEnergyStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicHealth = graphicsUtils.createDisplayObject("TEX+:" + "HP: " + ursula.maxHealth, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY - unitStatYSpacing*1.5}, style: unitGeneralStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicDefense = graphicsUtils.createDisplayObject("TEX+:" + "Def: " + ursula.defense, {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY + unitStatYSpacing*1.5}, style: unitDefenseStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var medicDamage = graphicsUtils.createDisplayObject("TEX+:" + "Heal: " + ursula.damageMember(), {position: {x: ursColumnX + healthEnergyXOffset, y: ursulaY + unitStatYSpacing*.5}, style: unitDamageStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var defenseAdditionText = '';
        if(ursula.defenseAdditions.length > 0) {
            var sign = '+';
            if(ursula.getDefenseAdditionSum() < 0) {
                sign = '';
            }
            defenseAdditionText = sign + ursula.getDefenseAdditionSum();
        }
        var ursulaDefenseAdditions = graphicsUtils.createDisplayObject("TEX+:" + defenseAdditionText, {position: {x: ursColumnX + healthEnergyXOffset + medicDefense.width/2, y: ursulaY + unitStatYSpacing*1.5}, style: unitDefenseAdditionsStyle, where: "hudText", anchor: {x: .5, y: .5}});
        if(defenseAdditionText != '') {
            medicDefense.position.x -= ursulaDefenseAdditions.width/2;
        }

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + skinnyDivider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        graphicsUtils.graduallyTint(medicPortraitBorder, 0x18bb96, 0x20902f, 6000);
        this.ursulaStats.push([medicPortrait, medicPortraitBorder, placeholder, medicHealth, medicEnergy, medicDamage, medicDefense, ursulaDefenseAdditions]);

        var ursulaKillsTitle = graphicsUtils.createDisplayObject("TEX+:" + kills, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaKills = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.kills, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaKillsTitle, ursulaKills, placeholder]);

        var ursulaDamageTitle = graphicsUtils.createDisplayObject("TEX+:" + damageDone, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamage = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageDone, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTitle, ursulaDamage, placeholder]);

        var ursulaDamageTakenTitle = graphicsUtils.createDisplayObject("TEX+:" + damageTaken, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageTaken, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageTakenTitle, ursulaDamageTaken, placeholder]);

        var ursulaDamageReducedByAmorTitle = graphicsUtils.createDisplayObject("TEX+:" + preventedArmorDamage, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageReducedByArmor, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaDamageReducedByAmorTitle, ursulaDamageReducedByAmor, placeholder]);

        var ursulaHealingDoneTitle = graphicsUtils.createDisplayObject("TEX+:" + healingDone, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var ursulaHealingDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.healingDone, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([ursulaHealingDoneTitle, ursulaHealingDone, placeholder]);

        var minesLaidTitle = graphicsUtils.createDisplayObject("TEX+:" + minesLaid, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var minesLaidDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.minesLaid, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([minesLaidTitle, minesLaidDone, placeholder]);

        var secretStepsTitle = graphicsUtils.createDisplayObject("TEX+:" + secretStepsPerformed, {position: ursulaPosition(title), style: titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
        var secretStepsDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.secretStepsPerformed, {position: ursulaPosition(reg), style: statStyle, where: "hudText", anchor: {x: .5, y: .5}});
        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {position: ursulaPosition(reg), style: statDividerStyle, where: "hudText", anchor: {x: .5, y: .5}});
        this.ursulaStats.push([secretStepsTitle, secretStepsDone, placeholder]);

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
