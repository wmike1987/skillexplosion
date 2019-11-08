#!/usr/bin/perl

print "Content-type:application/json\r\n\r\n";
#print "Content-Type:text/plain\r\n\r\n";
use JSON::PP;
use CGI;
use DBI;
use strict;

my $q = CGI->new;
my $name = $q->param('name');
my $score= $q->param('score');
my $gameTable = $q->param('game');
my $driver = "mysql"; 
my $database = "skillexp_highscores";
my $dsn = "DBI:$driver:database=$database";
my $userid = "skillexp_admin";
my $password = "highway4224";

my $dbh = DBI->connect($dsn, $userid, $password ) or die $DBI::errstr;
my $sth;
if($gameTable eq "Gauntlet") {
    $sth = $dbh->prepare("SELECT * FROM $gameTable ORDER BY wave DESC, sublevel DESC, score ASC limit 20");
} else {
    $sth = $dbh->prepare("SELECT * FROM $gameTable ORDER BY score DESC limit 20");
}
$sth->execute();

my @scores;
my $ref;
while ($ref= $sth->fetchrow_hashref) {
    push(@scores, $ref);
}

my $scoresjson = encode_json(\@scores);

$sth->finish();
#print ("name: mike");
print "$scoresjson";