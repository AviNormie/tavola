<?php

namespace App\Enums;

enum OrderStatus: string
{
    case New = 'new';
    case Preparing = 'preparing';
    case Ready = 'ready';
}
