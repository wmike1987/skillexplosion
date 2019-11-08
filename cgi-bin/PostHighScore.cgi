#!/usr/bin/perl
print "Content-type:application/cgi\r\n\r\n";

use CGI;
use DBI;
use strict;

my $q = CGI->new;
my $name = $q->param('name');
my $score= $q->param('score');
my $checkScore= $q->param('s');
my $checkRule= $q->param('ss');
my $gameTable= $q->param('game');
my $checkWave = $q->param('w');
my $wave= $q->param('wave');
my $sublevel= $q->param('sl');

my $multiplier = 1;
if($checkRule eq "t") {
    $multiplier = 33;
}
if($checkRule eq "s") {
    $multiplier = 77;
}
if($checkRule eq "f") {
    $multiplier = 55;
}

if($score * $multiplier == $checkScore) {
    if($wave > 0) {
        if($wave * 44 == $checkWave) {
            my $driver = "mysql"; 
            my $database = "skillexp_highscores";
            my $dsn = "DBI:$driver:database=$database";
            my $userid = "skillexp_admin";
            my $password = "highway4224";
            
            my $dbh = DBI->connect($dsn, $userid, $password ) or die $DBI::errstr;
            my $sth = $dbh->prepare("INSERT INTO $gameTable (name, score, wave, sublevel) VALUES ('$name', $score, $wave, $sublevel)");
            $sth->execute() or die $DBI::errstr;
            $sth->finish();
            $dbh->commit or die $DBI::errstr;
        }
    } else {
        my $driver = "mysql"; 
        my $database = "skillexp_highscores";
        my $dsn = "DBI:$driver:database=$database";
        my $userid = "skillexp_admin";
        my $password = "highway4224";
        
        my $dbh = DBI->connect($dsn, $userid, $password ) or die $DBI::errstr;
        my $sth = $dbh->prepare("INSERT INTO $gameTable VALUES ('$name', $score)");
        $sth->execute() or die $DBI::errstr;
        $sth->finish();
        $dbh->commit or die $DBI::errstr;
    }
}