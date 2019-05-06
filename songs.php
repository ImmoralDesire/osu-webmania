<?php
$za = new ZipArchive();
$TITLE_REGEX = '~Title:(.*)~';
$VERSION_REGEX = '~Version:(.*)~';
$ARTIST_REGEX = '~Artist:(.*)~';
$CREATOR_REGEX = '~Creator:(.*)~';
$AUDIO_REGEX = '~AudioFilename:(.*)~';
$BACKGROUND_REGEX = '~0,0,"(.*?)"~';
$KEYS_REGEX = '~CircleSize:(.*)~';
$MODE_REGEX = '~Mode:(.*)~';

class Note
{
    public $startTime;
    public $column;

    public function __construct($column, $startTime)
    {
        $this->column = $column;
        $this->startTime = $startTime;
    }
}

class HoldNote extends Note
{
    public $endTime;

    public function __construct($column, $startTime, $endTime)
    {
        parent::__construct($column, $startTime);
        $this->endTime = $endTime;
    }
}

class Beatmap
{
    public $title;
    public $version;
    public $artist;
    public $creator;

    public $audio;
    public $background;

    public $keys;
    public $objects;
    public $totalNotes;

    public function __construct()
    {
    }

    public static function parse($file)
    {
        $parse = false;
        $objects = array();
        $beatmap = new Beatmap();

        global $TITLE_REGEX;
        global $VERSION_REGEX;
        global $ARTIST_REGEX;
        global $CREATOR_REGEX;

        global $AUDIO_REGEX;
        global $BACKGROUND_REGEX;

        global $KEYS_REGEX;
        global $MODE_REGEX;

        preg_match($TITLE_REGEX, $file, $title);
        preg_match($VERSION_REGEX, $file, $version);
        preg_match($ARTIST_REGEX, $file, $artist);
        preg_match($CREATOR_REGEX, $file, $creator);

        preg_match($AUDIO_REGEX, $file, $audio);
        preg_match($BACKGROUND_REGEX, $file, $background);

        preg_match($KEYS_REGEX, $file, $keys);
        preg_match($MODE_REGEX, $file, $mode);

        $title = trim($title[1]);
        $version = trim($version[1]);
        $artist = trim($artist[1]);
        $creator = trim($creator[1]);

        $audio = trim($audio[1]);
        $background = trim($background[1]);

        $keys = (int) trim($keys[1]);
        $mode = (int) trim($mode[1]);

        $beatmap->title = $title;
        $beatmap->version = $version;
        $beatmap->artist = $artist;
        $beatmap->creator = $creator;

        $beatmap->audio = $audio;
        $beatmap->background = $background;

        $beatmap->keys = $keys;
        $beatmap->mode = $mode;

        foreach (explode("\n", $file) as $line) {
            $line = trim($line);

            if ($parse && strlen($line) != 0) {
                /*
                 * x, y, time, type, hitSound, endTime
                 *
                 * column width = 512 / columns
                 * column = floor(x / column width)
                 *
                 * time in milliseconds
                 *
                 * type: 1 for circle, 128 for long note
                 *
                 * endTime: end of long note in milliseconds
                 */
                $tags = explode(",", $line);
                $columnWidth = 512 / $keys;
                $column = (int) min(floor($tags[0] / $columnWidth), $keys - 1);
                $time = (int) $tags[2];
                $sustain = $tags[3] == 128;
                $endTime = (int) explode(":", $tags[5])[0];

                $note = new Note($column, $time);

                if ($sustain) {
                    $note = new HoldNote($column, $time, $endTime);
                }
                //console.log(note);
                array_push($objects, $note);
            } else {
                $parse = false;
            }

            if ($line == "[Metadata]") {
                $meta = false;
            }

            if ($line == "[HitObjects]") {
                $parse = true;
            }
        }

        $beatmap->objects = $objects;
        $beatmap->totalNotes = count($objects);

        return $beatmap;
    }
}

class DifficultyHitObject
{
    public $baseObject;

    public $columns;

    public $strain = 1;
    public $individualStrains;
    public $heldUntil;

    public function __construct($baseObject, $columns, $speedMultiplier)
    {
        $this->baseObject = $baseObject;
        $this->individualStrains = array_fill(0, $columns, 0);
  			$this->heldUntil = array_fill(0, $columns, 0);
  			$this->columns = $columns;
    }

		public function calculateStrains($previous, $speedMultiplier) {
      $deltaTime = ($this->baseObject->startTime - $previous->baseObject->startTime) / $speedMultiplier;

			$individualDecay = pow(DifficultyCalculator::$INDIVIDUAL_DECAY_BASE, $deltaTime / 1000);
			$overallDecay = pow(DifficultyCalculator::$OVERALL_DECAY_BASE, $deltaTime / 1000);
			$holdFactor = 1;
			$holdAddition = 0;

      $endTime = $this->baseObject->startTime;

      if ($this->baseObject instanceof HoldNote) {
          $endTime = $this->baseObject->endTime;
      }

			for ($i = 0; $i < $this->columns; $i++) {
				$this->heldUntil[$i] = $previous->heldUntil[$i];

				if ($this->baseObject->startTime < $this->heldUntil[$i] && $endTime > $this->heldUntil[$i]
						&& $this->baseObject->startTime != $this->heldUntil[$i])
					$holdAddition = 1;

				if ($this->heldUntil[$i] > $endTime)
					$holdFactor = 1.25;

				$this->individualStrains[$i] = $previous->individualStrains[$i] * $individualDecay;
			}

			$this->heldUntil[$this->baseObject->column] = $endTime;
			$this->individualStrains[$this->baseObject->column] += 2 * $holdFactor;
			$this->strain = $previous->strain * $overallDecay + (1 + $holdAddition) * $holdFactor;
		}
}

class DifficultyCalculator {
    public static $STRAIN_STEP = 400;
    public static $STAR_SCALING_FACTOR = 0.018;

	  public static $INDIVIDUAL_DECAY_BASE = 0.125;
	  public static $OVERALL_DECAY_BASE = 0.3;

	  public static $DECAY_WEIGHT = 0.9;

    public function __construct() {
    }

    public static function calculateDifficulty($beatmap) {
        $objects = self::createDifficultyHitObjects($beatmap, 1);
        $strains = self::calculateStrains($objects, 1);

        usort($strains, function($a, $b) {
          return $b > $a;
        }); // Sort from highest to lowest strain.

        //var_dump($objects);

        $difficulty = 0;
        $weight = 1;
		    foreach($strains as $strain) {
    			$difficulty += $weight * $strain;
    			$weight *= self::$DECAY_WEIGHT;
    		}
		    return $difficulty * self::$STAR_SCALING_FACTOR;
    }

    public static function createDifficultyHitObjects($beatmap, $speedMultiplier)
    {
        $count = count($beatmap->objects);
        $objects = array();

        for ($i = 0; $i < $count; $i++) {
            array_push($objects, new DifficultyHitObject($beatmap->objects[$i], $beatmap->keys, $speedMultiplier));
        }

        usort($objects, function($a, $b) {
          $start1 = $a->baseObject->startTime;
          $start2 = $b->baseObject->startTime;

          return $start1 >= $start2;
        });

        $previous = null;
    		foreach($objects as $current) {
    			if ($previous != null)
    				$current->calculateStrains($previous, $speedMultiplier, $beatmap->keys);
    			$previous = $current;
    		}

        return $objects;
    }

    public static function calculateStrains($objects, $speedMultiplier) {
  		$highestStrains = array();
  		$realStrainStep = self::$STRAIN_STEP * $speedMultiplier;
  		$intervalEnd = $realStrainStep;
  		$maxStrain = 0;

  		$previous = null;
  		foreach($objects as $current) {
  			while ($current->baseObject->startTime > $intervalEnd) {
  				array_push($highestStrains, $maxStrain);
  				if ($previous != null) {
  					$individualDecay = pow(self::$INDIVIDUAL_DECAY_BASE,
  							($intervalEnd - $previous->baseObject->startTime) / 1000.0);
  					$overallDecay = pow(self::$OVERALL_DECAY_BASE,
  							($intervalEnd - $previous->baseObject->startTime) / 1000.0);
  					$maxStrain = $previous->individualStrains[$previous->baseObject->column] * $individualDecay
  							+ $previous->strain * $overallDecay;
  				}
  				$intervalEnd += $realStrainStep;
  			}
  			$maxStrain = max($maxStrain, $current->individualStrains[$current->baseObject->column] + $current->strain);
  			$previous = $current;
  		}
  		return $highestStrains;
  	}
}

function getDirContents($dir, &$results = array())
{
    $files = scandir($dir);

    foreach ($files as $key => $value) {
        $path = $dir.DIRECTORY_SEPARATOR.$value;
        if (!is_dir($path)) {
            $results[] = $path;
        } elseif ($value != "." && $value != "..") {
            getDirContents($path, $results);
            $results[] = $path;
        }
    }

    return $results;
}

function getContents(&$fp)
{
    if (!$fp) {
        exit("failed\n");
    }
    $contents = '';

    while (!feof($fp)) {
        $contents .= fread($fp, 2);
    }

    return $contents;
}

$maps = array();

function unzip($file, &$maps)
{
    global $za;
    global $TITLE_REGEX;
    global $VERSION_REGEX;
    global $AUDIO_REGEX;
    global $BACKGROUND_REGEX;

    $za->open($file);

    $images = array();

    for ($i = 0; $i < $za->numFiles; $i++) {
        $stat = $za->statIndex($i);
        $filename = $stat['name'];
        $ext = pathinfo($filename, PATHINFO_EXTENSION);

        if ($ext == "osu") {
            $fp = $za->getStream($filename);
            $contents = file_get_contents($fp);
            fclose($fp);

            preg_match($TITLE_REGEX, $contents, $title);
            preg_match($VERSION_REGEX, $contents, $version);
            preg_match($AUDIO_REGEX, $contents, $audio);
            preg_match($BACKGROUND_REGEX, $contents, $background);

            $title = trim($title[1]);
            $version = trim($version[1]);
            $audio = trim($audio[1]);
            $background = trim($background[1]);

            $map = array();
            $map['title'] = $title;
            $map['version'] = $version;
            $map['background'] = $background;
            $map['audio'] = $audio;

            array_push($maps, $map);
        }
    }
}

foreach (getDirContents("songs/unpacked") as $filename) {
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    $dir = pathinfo($filename, PATHINFO_DIRNAME);

    if ($ext == "osu") {
        $contents = file_get_contents($filename);

        preg_match($TITLE_REGEX, $contents, $title);
        preg_match($VERSION_REGEX, $contents, $version);
        preg_match($AUDIO_REGEX, $contents, $audio);
        preg_match($BACKGROUND_REGEX, $contents, $background);

        $title = trim($title[1]);
        $version = trim($version[1]);
        $audio = trim($audio[1]);
        $background = trim($background[1]);

        $beatmap = Beatmap::parse($contents);
        if(!($beatmap->keys == 4 || $beatmap->keys == 7) || $beatmap->mode != 3) {
          continue;
        }

        $map = array();
        $map['title'] = $beatmap->title;
        $map['version'] = $beatmap->version;
        $map['artist'] = $beatmap->artist;
        $map['creator'] = $beatmap->creator;
        $map['difficulty'] = DifficultyCalculator::calculateDifficulty($beatmap);
        $map['keys'] = $beatmap->keys;
        $map['background'] = $dir.DIRECTORY_SEPARATOR.$background;
        $map['audio'] = $dir.DIRECTORY_SEPARATOR.$audio;
        $map['file'] = $filename;
        $map['dir'] = $dir;

        array_push($maps, $map);
    }
}

usort($maps, function($a, $b) {
  if(strcasecmp($a['title'], $b['title']) == 0) {
    if(strcasecmp($a['artist'], $b['artist']) == 0) {
      if(strcasecmp($a['creator'], $b['creator']) == 0) {
        return $a['difficulty'] > $b['difficulty'];
      }

      return strcasecmp($a['creator'], $b['creator']);
    }

    return strcasecmp($a['artist'], $b['artist']);
  }

  return strcasecmp($a['title'], $b['title']);
});
  //unzip($file, $maps);
header('Content-Type: application/json');
echo json_encode(array('songs' => $maps), JSON_PRETTY_PRINT);
