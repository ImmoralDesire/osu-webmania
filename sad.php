<?php
$za = new ZipArchive();
$TITLE_REGEX = '~Title:(.*)~';
$VERSION_REGEX = '~Version:(.*)~';
$AUDIO_REGEX = '~AudioFilename:(.*)~';
$BACKGROUND_REGEX = '~0,0,"(.*?)"~';
$KEYS_REGEX = '~CircleSize:(.*)~';

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
        global $AUDIO_REGEX;
        global $BACKGROUND_REGEX;
        global $KEYS_REGEX;

        preg_match($TITLE_REGEX, $file, $title);
        preg_match($VERSION_REGEX, $file, $version);
        preg_match($AUDIO_REGEX, $file, $audio);
        preg_match($BACKGROUND_REGEX, $file, $background);
        preg_match($KEYS_REGEX, $file, $keys);

        $title = trim($title[1]);
        $version = trim($version[1]);
        $audio = trim($audio[1]);
        $background = trim($background[1]);
        $keys = (int) trim($keys[1]);

        $beatmap->title = $title;
        $beatmap->version = $version;
        $beatmap->audio = $audio;
        $beatmap->background = $background;
        $beatmap->keys = $keys;

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

abstract class Skill
{
    /// <summary>
    /// The peak strain for each <see cref="DifficultyCalculator.SectionLength"/> section of the beatmap.
    /// </summary>

    /// <summary>
    /// Strain values are multiplied by this number for the given skill. Used to balance the value of different skills between each other.
    /// </summary>
    protected $skillMultiplier;

    /// <summary>
    /// Determines how quickly strain decays for the given skill.
    /// For example a value of 0.15 indicates that strain decays to 15% of its original value in one second.
    /// </summary>
    protected $strainDecayBase;

    /// <summary>
    /// The weight by which each strain value decays.
    /// </summary>
    protected $decayWeight = 0.9;

    /// <summary>
        /// <see cref="DifficultyHitObject"/>s that were processed previously. They can affect the strain values of the following objects.
        /// </summary>
        protected $previous = array(); // Contained objects not used yet

        private $currentStrain = 1; // We keep track of the strain level at all times throughout the beatmap.
        private $currentSectionPeak = 1; // We also keep track of the peak strain level in the current section.

        public $strainPeaks = array();

    /// <summary>
    /// Process a <see cref="DifficultyHitObject"/> and update current strain values accordingly.
    /// </summary>
    public function process($current)
    {
        $this->currentStrain *= $this->strainDecay($current->deltaTime);
        $this->currentStrain += $this->strainValueOf($current) * $this->skillMultiplier;

        $this->currentSectionPeak = max($this->currentStrain, $this->currentSectionPeak);

        array_push($this->previous, $current);
    }

    /// <summary>
    /// Saves the current peak strain level to the list of strain peaks, which will be used to calculate an overall difficulty.
    /// </summary>
    public function saveCurrentPeak()
    {
        if (count($this->previous) > 0) {
            array_push($this->strainPeaks, $this->currentSectionPeak);
        }
    }

    /// <summary>
    /// Sets the initial strain level for a new section.
    /// </summary>
    /// <param name="offset">The beginning of the new section in milliseconds.</param>
    public function startNewSectionFrom($offset)
    {
        // The maximum strain of the new section is not zero by default, strain decays as usual regardless of section boundaries.
        // This means we need to capture the strain level at the beginning of the new section, and use that as the initial peak level.
        if (count($this->previous) > 0) {
            $this->currentSectionPeak = $this->currentStrain * $this->strainDecay($offset - $this->previous[0]->baseObject->startTime);
        }
    }

    /// <summary>
    /// Returns the calculated difficulty value representing all processed <see cref="DifficultyHitObject"/>s.
    /// </summary>
    public function difficultyValue()
    {
        //$strainPeaks.Sort((a, b) => b.CompareTo(a)); // Sort from highest to lowest strain.

        $difficulty = 0;
        $weight = 1;

        // Difficulty is the weighted sum of the highest strains from every section.
        foreach ($strainPeaks as $strain) {
            $difficulty += $strain * $weight;
            $weight *= $decayWeight;
        }

        return $difficulty;
    }

    /// <summary>
    /// Calculates the strain value of a <see cref="DifficultyHitObject"/>. This value is affected by previously processed objects.
    /// </summary>
    abstract protected function strainValueOf($current);

    private function strainDecay($ms)
    {
        pow($this->strainDecayBase, $ms / 1000);
    }
}

class Overall extends Skill
{
    protected $skillMultiplier = 1;
    protected $strainDecayBase = 0.3;

    private $holdEndTimes;

    private $columns;

    public function __construct($columns)
    {
        $this->columns = $columns;

        $this->holdEndTimes = array_fill(0, $columns, 0);
    }

    protected function strainValueOf($current)
    {
        $endTime = $current->baseObject->startTime;

        if ($current->baseObject instanceof HoldNote) {
            $endTime = $current->baseObject->endTime;
        }

        $holdFactor = 1.0; // Factor in case something else is held
            $holdAddition = 0; // Addition to the current note in case it's a hold and has to be released awkwardly

            for ($i = 0; $i < $this->columns; $i++) {
                // If there is at least one other overlapping end or note, then we get an addition, buuuuuut...
                if ($current->baseObject->startTime < $this->holdEndTimes[$i] && $endTime > $this->holdEndTimes[$i]) {
                    $holdAddition = 1.0;
                }

                // ... this addition only is valid if there is _no_ other note with the same ending.
                // Releasing multiple notes at the same time is just as easy as releasing one
                if ($endTime == $this->holdEndTimes[$i]) {
                    $holdAddition = 0;
                }

                // We give a slight bonus if something is held meanwhile
                if ($this->holdEndTimes[$i] > $endTime) {
                    $holdFactor = 1.25;
                }
            }

        $this->holdEndTimes[$current->baseObject->column] = $endTime;

        return (1 + $holdAddition) * $holdFactor;
    }
}

class Individual extends Skill
{
    protected $skillMultiplier = 1;
    protected $strainDecayBase = 0.125;

    private $holdEndTimes = array();

    private $column;

    public function __construct($column, $columns)
    {
        $this->column = $column;

        $this->holdEndTimes = array_fill(0, $columns, 0);
    }

    protected function strainValueOf($current)
    {
        $endTime = $current->baseObject->startTime;

        if ($current->baseObject instanceof HoldNote) {
            $endTime = $current->baseObject->endTime;
        }
        try {
            if ($current->baseObject->column != $this->column) {
                return 0;
            }

            // We give a slight bonus if something is held meanwhile
            return (array_reduce($this->holdEndTimes, function ($t) use ($endTime) {
                return $t > $endTime;
            }) ? 2.5 : 2);

            //return $holdEndTimes.Any(t => t > endTime) ? 2.5 : 2;
        } finally {
            $this->holdEndTimes[$current->baseObject->column] = $endTime;
        }
    }
}

class DifficultyHitObject
{
    public $baseObject;
    public $lastObject;
    public $deltaTime;

    public function __construct($baseObject, $lastObject, $speedMultiplier)
    {
        $this->baseObject = $baseObject;
        $this->lastObject = $lastObject;
        $this->deltaTime = ($baseObject->startTime - $lastObject->startTime) / $speedMultiplier;
    }
}

class DifficultyCalculator
{
    public static $STRAIN_STEP = 400;
    public static $star_scaling_factor = 0.018;

    public function __construct()
    {
    }

    public static function calculateDifficulty($beatmap)
    {
        $objects = self::createDifficultyHitObjects($beatmap, 1);
        usort($objects, function($a, $b) {
          return $a->baseObject->startTime > $b->baseObject->startTime;
        });
        $skills = self::createSkills($beatmap);
        self::calculateStrains($beatmap, $objects, $skills, 1);

        $overall = array_filter($skills, function($skill) {
          return $skill instanceof Overall;
        })[0];

        $individuals = array_filter($skills, function($skill) {
          return $skill instanceof Individual;
        });

        $aggregatePeaks = array_fill(0, count($overall->strainPeaks), 0.0);

        foreach ($individuals as $individual)
        {
          $count = count($individual->strainPeaks);
            for ($i = 0; $i < $count; $i++)
            {
                $aggregate = $individual->strainPeaks[$i] + $overall->strainPeaks[$i];

                if ($aggregate > $aggregatePeaks[$i])
                    $aggregatePeaks[$i] = $aggregate;
            }
        }

        usort($aggregatePeaks, function($a, $b) {
          return $b > $a;
        }); // Sort from highest to lowest strain.

        $difficulty = 0;
        $weight = 1;

        // Difficulty is the weighted sum of the highest strains from every section.
        foreach ($aggregatePeaks as $strain)
        {
            $difficulty += $strain * $weight;
            $weight *= 0.9;
        }

        return $difficulty;
    }

    public static function calculateStrains($beatmap, $objects, &$skills, $speedMultiplier)
    {
        $sectionLength = self::$STRAIN_STEP * $speedMultiplier;

        // The first object doesn't generate a strain, so we begin with an incremented section end
        $currentSectionEnd = ceil($beatmap->objects[0]->startTime / $sectionLength) * $sectionLength;
        foreach ($objects as $h) {
            while ($h->baseObject->startTime > $currentSectionEnd) {
                foreach ($skills as $s) {
                    $s->saveCurrentPeak();
                    $s->startNewSectionFrom($currentSectionEnd);
                }

                $currentSectionEnd += $sectionLength;
            }

            foreach ($skills as $s) {
                $s->process($h);
            }
        }

        // The peak strain will not be saved for the last section in the above loop
        foreach ($skills as $s) {
            $s->saveCurrentPeak();
        }
    }

    public static function createDifficultyHitObjects($beatmap, $speedMultiplier)
    {
        $count = count($beatmap->objects);
        $objects = array();

        for ($i = 1; $i < $count; $i++) {
            array_push($objects, new DifficultyHitObject($beatmap->objects[$i], $beatmap->objects[$i - 1], $speedMultiplier));
        }

        return $objects;
    }

    public static function createSkills($beatmap)
    {
        $columns = $beatmap->keys;

        $skills = array(new Overall($columns));

        for ($i = 0; $i < $columns; $i++) {
            array_push($skills, new Individual($i, $columns));
        }

        return $skills;
    }
}
