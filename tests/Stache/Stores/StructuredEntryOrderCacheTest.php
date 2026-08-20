<?php

namespace Tests\Stache\Stores;

use Facades\Tests\Factories\EntryFactory;
use PHPUnit\Framework\Attributes\Test;
use Statamic\Facades\Collection;
use Statamic\Facades\Entry;
use Statamic\Structures\CollectionStructure;
use Tests\PreventSavingStacheItemsToDisk;
use Tests\TestCase;

class StructuredEntryOrderCacheTest extends TestCase
{
    use PreventSavingStacheItemsToDisk;

    private $structure;

    public function setUp(): void
    {
        parent::setUp();

        $this->structure = (new CollectionStructure)->handle('test')->maxDepth(1);

        Collection::make('test')
            ->sites(['en'])
            ->structure($this->structure)
            ->save();

        $this->structure->makeTree('en')->save();
    }

    #[Test]
    public function a_new_entry_is_indexed_after_a_previously_cached_orderable_tree()
    {
        EntryFactory::id('1')->slug('one')->collection('test')->create();
        EntryFactory::id('2')->slug('two')->collection('test')->create();

        $tree = $this->structure->in('en')->tree([
            ['entry' => '1'],
            ['entry' => '2'],
        ]);
        $tree->save();

        // Prime the healed tree before the new entry exists. The stored tree itself will not
        // change when an entry is added to an orderable collection.
        $this->assertSame(['1', '2'], collect($tree->tree())->pluck('entry')->all());

        EntryFactory::id('3')->slug('three')->collection('test')->create();

        $this->assertSame(3, Entry::find('3')->order());
        $this->assertSame(['1', '2', '3'], collect($tree->tree())->pluck('entry')->all());
    }
}
