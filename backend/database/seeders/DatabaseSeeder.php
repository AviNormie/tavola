<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Public demo password for both seeded staff accounts. Never use this pattern in production.
    private const DEMO_PASSWORD = 'demo1234';

    public function run(): void
    {
        foreach ($this->restaurants() as $data) {
            $restaurant = Restaurant::create([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'default_locale' => $data['locale'],
                'currency' => $data['currency'],
                'description_en' => $data['description'][0],
                'description_it' => $data['description'][1],
            ]);

            User::create([
                'name' => $data['staff_name'],
                'email' => $data['staff_email'],
                'password' => self::DEMO_PASSWORD,
                'restaurant_id' => $restaurant->id,
            ]);

            foreach (range(1, $data['tables']) as $number) {
                $restaurant->tables()->create(['number' => $number]);
            }

            // Menu item rows are [name_en, name_it, description_en, description_it, price_cents, available?]
            foreach ($data['menu'] as $sort => [$nameEn, $nameIt, $items]) {
                $category = $restaurant->categories()->create(['name_en' => $nameEn, 'name_it' => $nameIt, 'sort_order' => $sort]);
                foreach ($items as $row) {
                    [$en, $it, $descEn, $descIt, $price] = $row;
                    $restaurant->menuItems()->create([
                        'menu_category_id' => $category->id,
                        'name_en' => $en, 'name_it' => $it,
                        'description_en' => $descEn, 'description_it' => $descIt,
                        'price_cents' => $price,
                        'is_available' => $row[5] ?? true,
                    ]);
                }
            }

            // Sample orders are [table, minutes ago, status, [[English item name, quantity], ...]], oldest first.
            foreach ($data['orders'] as $n => [$table, $minutesAgo, $status, $lines]) {
                $order = $restaurant->orders()->create([
                    'restaurant_table_id' => $restaurant->tables()->where('number', $table)->value('id'),
                    'number' => $n + 1,
                    'status' => $status,
                    'total_cents' => 0,
                    'created_at' => now()->subMinutes($minutesAgo),
                ]);

                foreach ($lines as [$itemName, $quantity]) {
                    $item = $restaurant->menuItems()->where('name_en', $itemName)->firstOrFail();
                    $order->items()->create(['menu_item_id' => $item->id, 'quantity' => $quantity, 'unit_price_cents' => $item->price_cents]);
                }

                $order->update(['total_cents' => $order->items->sum(fn ($l) => $l->quantity * $l->unit_price_cents)]);
            }
        }
    }

    private function restaurants(): array
    {
        $new = OrderStatus::New;
        $prep = OrderStatus::Preparing;
        $ready = OrderStatus::Ready;

        return [
            [
                'name' => 'Trattoria Sole',
                'slug' => 'trattoria-sole',
                'locale' => 'it',
                'currency' => 'EUR',
                'description' => [
                    'Family-run Roman cooking in Trastevere. Fresh pasta every morning, a short wine list and nothing rushed.',
                    'Cucina romana di famiglia a Trastevere. Pasta fresca ogni mattina, una carta dei vini breve e nessuna fretta.',
                ],
                'staff_name' => 'Giulia Ferri',
                'staff_email' => 'staff@trattoria-sole.test',
                'tables' => 8,
                'menu' => [
                    ['Starters', 'Antipasti', [
                        ['Tomato bruschetta', 'Bruschette al pomodoro', 'Toasted country bread, cherry tomatoes, basil and extra-virgin olive oil.', 'Pane casereccio tostato, pomodorini, basilico e olio extravergine.', 700],
                        ['Burrata with cherry tomatoes', 'Burrata con pomodorini', 'Creamy Puglian burrata, roasted cherry tomatoes and basil oil.', 'Burrata pugliese cremosa, pomodorini arrostiti e olio al basilico.', 1200],
                        ['Beef carpaccio', 'Carpaccio di manzo', 'Thinly sliced beef, rocket, shaved Grana Padano and lemon.', 'Manzo affettato sottile, rucola, scaglie di Grana Padano e limone.', 1400],
                    ]],
                    ['Pasta', 'Primi', [
                        ['Spaghetti cacio e pepe', 'Spaghetti cacio e pepe', 'Pecorino Romano and black pepper, the way it is made in Rome.', 'Pecorino Romano e pepe nero, come si fa a Roma.', 1300],
                        ['Rigatoni all\'amatriciana', 'Rigatoni all\'amatriciana', 'Guanciale, tomato and pecorino.', 'Guanciale, pomodoro e pecorino.', 1350],
                        ['Tagliatelle with ragù', 'Tagliatelle al ragù', 'Hand-cut egg pasta with slow-cooked beef and pork ragù.', 'Pasta all\'uovo tagliata a mano con ragù di manzo e maiale cotto lentamente.', 1400],
                        ['Porcini mushroom risotto', 'Risotto ai funghi porcini', 'Carnaroli rice, porcini and parsley.', 'Riso Carnaroli, funghi porcini e prezzemolo.', 1500, false],
                    ]],
                    ['Mains', 'Secondi', [
                        ['Saltimbocca alla romana', 'Saltimbocca alla romana', 'Veal with prosciutto and sage in white wine butter.', 'Vitello con prosciutto e salvia nel burro al vino bianco.', 1900],
                        ['Baked sea bass', 'Branzino al forno', 'Whole sea bass baked with potatoes, olives and cherry tomatoes.', 'Branzino intero al forno con patate, olive e pomodorini.', 2200],
                        ['Hunter-style chicken', 'Pollo alla cacciatora', 'Braised chicken with tomato, rosemary and olives.', 'Pollo brasato con pomodoro, rosmarino e olive.', 1700],
                    ]],
                    ['Desserts', 'Dolci', [
                        ['House tiramisù', 'Tiramisù della casa', 'Savoiardi, mascarpone and espresso, made each morning.', 'Savoiardi, mascarpone ed espresso, preparato ogni mattina.', 700],
                        ['Panna cotta with berries', 'Panna cotta ai frutti di bosco', 'Vanilla panna cotta with a warm wild berry sauce.', 'Panna cotta alla vaniglia con salsa calda ai frutti di bosco.', 650],
                    ]],
                    ['Drinks', 'Bevande', [
                        ['Mineral water 75cl', 'Acqua minerale 75cl', 'Still or sparkling.', 'Naturale o frizzante.', 300],
                        ['House wine (glass)', 'Vino della casa (calice)', 'Red or white from the Castelli Romani.', 'Rosso o bianco dei Castelli Romani.', 550],
                        ['Espresso', 'Caffè espresso', 'Roasted in Testaccio.', 'Tostato a Testaccio.', 200],
                    ]],
                ],
                'orders' => [
                    [3, 52, $ready, [['Spaghetti cacio e pepe', 2], ['House wine (glass)', 2]]],
                    [6, 34, $ready, [['Burrata with cherry tomatoes', 1], ['Saltimbocca alla romana', 1], ['Mineral water 75cl', 1]]],
                    [2, 14, $prep, [['Tagliatelle with ragù', 2], ['Tomato bruschetta', 1], ['House wine (glass)', 2]]],
                    [5, 6, $prep, [['Baked sea bass', 1], ['Rigatoni all\'amatriciana', 1]]],
                    [1, 2, $new, [['Beef carpaccio', 1], ['House tiramisù', 2], ['Espresso', 2]]],
                ],
            ],
            [
                'name' => 'North Pier Kitchen',
                'slug' => 'north-pier-kitchen',
                'locale' => 'en',
                'currency' => 'GBP',
                'description' => [
                    'Seasonal British plates and a short list of good drinks, a few steps from the harbour wall.',
                    'Piatti britannici di stagione e una breve carta di bevande, a pochi passi dal molo.',
                ],
                'staff_name' => 'Tom Hargreaves',
                'staff_email' => 'staff@north-pier.test',
                'tables' => 10,
                'menu' => [
                    ['Starters', 'Antipasti', [
                        ['Crispy calamari', 'Calamari croccanti', 'Lightly dusted squid with lemon aioli.', 'Calamari leggermente infarinati con maionese al limone.', 850],
                        ['Roasted tomato soup', 'Zuppa di pomodori arrostiti', 'Slow-roasted tomatoes, basil and sourdough.', 'Pomodori arrostiti lentamente, basilico e pane a lievitazione naturale.', 750],
                        ['Smoked salmon toast', 'Toast al salmone affumicato', 'Sourdough, crème fraîche, capers and dill.', 'Pane a lievitazione naturale, crème fraîche, capperi ed aneto.', 950],
                    ]],
                    ['Mains', 'Piatti principali', [
                        ['Beer-battered haddock & chips', 'Eglefino in pastella con patatine', 'Line-caught haddock, mushy peas and tartare sauce.', 'Eglefino pescato a lenza, purè di piselli e salsa tartara.', 1650],
                        ['Dry-aged burger', 'Hamburger di manzo frollato', 'Dry-aged beef, aged cheddar, pickles and brioche bun.', 'Manzo frollato, cheddar stagionato, sottaceti e pane brioche.', 1550],
                        ['Wild mushroom pie', 'Torta salata ai funghi selvatici', 'Shortcrust pie with wild mushrooms, thyme and greens.', 'Torta di pasta brisée con funghi selvatici, timo e verdure.', 1450],
                        ['Pan-roasted cod', 'Merluzzo in padella', 'Cod fillet, brown shrimp butter and samphire.', 'Filetto di merluzzo, burro ai gamberetti e salicornia.', 1900, false],
                    ]],
                    ['Sides', 'Contorni', [
                        ['Triple-cooked chips', 'Patatine cotte tre volte', 'Crisp outside, fluffy inside, with sea salt.', 'Croccanti fuori, morbide dentro, con sale marino.', 450],
                        ['Charred broccoli', 'Broccoli grigliati', 'Tenderstem broccoli, chilli and garlic.', 'Broccoletti grigliati, peperoncino e aglio.', 500],
                    ]],
                    ['Desserts', 'Dolci', [
                        ['Sticky toffee pudding', 'Sticky toffee pudding', 'Warm date sponge with toffee sauce and vanilla ice cream.', 'Dolce caldo ai datteri con salsa al caramello e gelato alla vaniglia.', 700],
                        ['Lemon posset', 'Posset al limone', 'Set lemon cream with a shortbread biscuit.', 'Crema al limone con un biscotto shortbread.', 650],
                    ]],
                    ['Drinks', 'Bevande', [
                        ['Craft lager (pint)', 'Birra artigianale (pinta)', 'Brewed twenty miles up the coast.', 'Prodotta a una trentina di chilometri lungo la costa.', 650],
                        ['Elderflower pressé', 'Sciroppo di sambuco', 'Sparkling elderflower with fresh mint.', 'Sambuco frizzante con menta fresca.', 400],
                        ['Flat white', 'Flat white', 'Double shot with steamed milk.', 'Doppio espresso con latte montato.', 320],
                    ]],
                ],
                'orders' => [
                    [4, 61, $ready, [['Beer-battered haddock & chips', 2], ['Craft lager (pint)', 2]]],
                    [9, 38, $ready, [['Smoked salmon toast', 1], ['Wild mushroom pie', 1], ['Charred broccoli', 1]]],
                    [1, 17, $prep, [['Dry-aged burger', 2], ['Triple-cooked chips', 1], ['Elderflower pressé', 2]]],
                    [7, 8, $prep, [['Crispy calamari', 1], ['Roasted tomato soup', 1]]],
                    [3, 3, $new, [['Sticky toffee pudding', 2], ['Flat white', 2]]],
                    [10, 1, $new, [['Beer-battered haddock & chips', 1], ['Lemon posset', 1]]],
                ],
            ],
        ];
    }
}
