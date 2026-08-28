# UI 图集提示词代码块

本文件只存放可复制的 UI 图集提示词组；生成前 UI 映射、图标主体和图集规则以 `ui-icon-page-inventory.md` 为准。已确认图标的开发入口是 `../ui-icon-final/README.md`。

- 每张 UI 图集固定 `2048x2048`，最多 `50` 个 UI 图标，编号为 `UIATLAS_001` 起。
- 每个 UI 图标绘制框固定 `128x128`，坐标格式为 `NNN icon(x,y,128,128) 元素+元素`。
- 每张提示词图集按 `每行最多7个、最多50个` 槽位排布，槽位步进 `144x144`，第 001 格从 `icon(416,208,128,128)` 开始；只在列出的 `icon(...)` 框内绘制，未列出的格子必须完全透明。
- 每个提示词代码块开头只写一次完整生成说明；下面逐行只写位置号、绘制框和图标主体，不重复风格规则。
- UI 按钮默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。
- 每行不重复写 `pxui_*`；图标 ID 按下方“图集位置映射”反查。
- 不同模块不得放在同一张图集；角色与老师头像图集只能放 `pxui_role_001`-`pxui_role_018`；`standalone_25th_hour_icon` 单独生成，不进入任何图集。

## 图集位置映射

本节用于 `图集编号 + 图集内位置号 -> 正式图标ID` 反查；提示词代码块每行不重复写 `pxui_*`。

```text
# UIATLAS_001 | 模块：基础操作按钮
001 -> pxui_base_001
002 -> pxui_base_002
003 -> pxui_base_003
004 -> pxui_base_004
005 -> pxui_base_005
006 -> pxui_base_006
007 -> pxui_base_007
008 -> pxui_base_008
009 -> pxui_base_009
010 -> pxui_base_010
011 -> pxui_base_011
012 -> pxui_base_012
013 -> pxui_base_013
014 -> pxui_base_014
015 -> pxui_base_015
016 -> pxui_base_016
017 -> pxui_base_017
018 -> pxui_base_018
019 -> pxui_base_019
020 -> pxui_base_020
021 -> pxui_base_021
022 -> pxui_base_022
023 -> pxui_base_023
024 -> pxui_base_024
025 -> pxui_base_025
026 -> pxui_base_026
027 -> pxui_base_027
028 -> pxui_base_028
029 -> pxui_base_029
030 -> pxui_base_030
031 -> pxui_base_031
032 -> pxui_base_032
033 -> pxui_base_033
034 -> pxui_base_034
035 -> pxui_base_035
036 -> pxui_base_036
037 -> pxui_base_037
038 -> pxui_base_038
039 -> pxui_base_039
040 -> pxui_base_040
041 -> pxui_base_041
042 -> pxui_base_042
043 -> pxui_base_043
044 -> pxui_base_044
045 -> pxui_base_045
046 -> pxui_base_046
047 -> pxui_base_047
048 -> pxui_base_048
```

```text
# UIATLAS_002 | 模块：状态数值与反馈
001 -> pxui_stat_001
002 -> pxui_stat_002
003 -> pxui_stat_003
004 -> pxui_stat_004
005 -> pxui_stat_005
006 -> pxui_stat_006
007 -> pxui_stat_007
008 -> pxui_stat_008
009 -> pxui_stat_009
010 -> pxui_stat_010
011 -> pxui_stat_011
012 -> pxui_stat_012
013 -> pxui_stat_013
014 -> pxui_stat_014
015 -> pxui_stat_015
016 -> pxui_stat_016
017 -> pxui_stat_017
018 -> pxui_stat_018
019 -> pxui_stat_019
020 -> pxui_stat_020
021 -> pxui_stat_021
022 -> pxui_stat_022
023 -> pxui_stat_023
024 -> pxui_stat_024
025 -> pxui_stat_025
026 -> pxui_stat_026
027 -> pxui_stat_027
028 -> pxui_stat_028
029 -> pxui_stat_029
030 -> pxui_stat_030
031 -> pxui_stat_031
032 -> pxui_stat_032
033 -> pxui_stat_033
034 -> pxui_stat_034
035 -> pxui_stat_035
036 -> pxui_stat_036
037 -> pxui_stat_037
038 -> pxui_stat_038
```

```text
# UIATLAS_003 | 模块：系统入口图标
001 -> pxui_system_001
002 -> pxui_system_002
003 -> pxui_system_003
004 -> pxui_system_004
005 -> pxui_system_005
006 -> pxui_system_006
007 -> pxui_system_007
008 -> pxui_system_008
009 -> pxui_system_009
010 -> pxui_system_010
011 -> pxui_system_011
012 -> pxui_system_012
013 -> pxui_system_013
014 -> pxui_system_014
015 -> pxui_system_015
016 -> pxui_system_016
017 -> pxui_system_017
018 -> pxui_system_018
019 -> pxui_system_019
020 -> pxui_system_020
021 -> pxui_system_021
022 -> pxui_system_022
023 -> pxui_system_023
024 -> pxui_system_024
025 -> pxui_system_025
026 -> pxui_system_026
027 -> pxui_system_027
028 -> pxui_system_028
029 -> pxui_system_029
030 -> pxui_system_030
031 -> pxui_system_031
032 -> pxui_system_032
033 -> pxui_system_033
034 -> pxui_system_034
035 -> pxui_system_035
036 -> pxui_system_037
037 -> pxui_system_038
038 -> pxui_system_039
039 -> pxui_system_040
040 -> pxui_system_041
041 -> pxui_system_042
042 -> pxui_system_043
```

```text
# UIATLAS_004 | 模块：周行动、项目、评图、模型
001 -> pxui_action_001
002 -> pxui_action_002
003 -> pxui_action_003
004 -> pxui_action_004
005 -> pxui_action_005
006 -> pxui_action_006
007 -> pxui_action_007
008 -> pxui_action_008
009 -> pxui_action_009
010 -> pxui_action_010
011 -> pxui_action_011
012 -> pxui_action_012
013 -> pxui_action_013
014 -> pxui_action_014
015 -> pxui_action_015
016 -> pxui_action_016
017 -> pxui_action_017
018 -> pxui_action_018
019 -> pxui_action_019
020 -> pxui_action_020
021 -> pxui_action_021
022 -> pxui_action_022
023 -> pxui_action_023
024 -> pxui_action_024
025 -> pxui_action_025
026 -> pxui_action_026
027 -> pxui_action_027
028 -> pxui_action_028
029 -> pxui_action_029
030 -> pxui_action_030
```

```text
# UIATLAS_005 | 模块：角色与老师头像
001 -> pxui_role_001
002 -> pxui_role_002
003 -> pxui_role_003
004 -> pxui_role_004
005 -> pxui_role_005
006 -> pxui_role_006
007 -> pxui_role_007
008 -> pxui_role_008
009 -> pxui_role_009
010 -> pxui_role_010
011 -> pxui_role_011
012 -> pxui_role_012
013 -> pxui_role_013
014 -> pxui_role_014
015 -> pxui_role_015
016 -> pxui_role_016
017 -> pxui_role_017
018 -> pxui_role_018
```

```text
# UIATLAS_006 | 模块：导师阶段任务
001 -> pxui_role_019
002 -> pxui_role_020
003 -> pxui_role_021
004 -> pxui_role_022
005 -> pxui_role_023
006 -> pxui_role_024
007 -> pxui_role_025
```

```text
# UIATLAS_007 | 模块：课程图标
001 -> pxui_role_026
002 -> pxui_role_027
003 -> pxui_role_028
004 -> pxui_role_029
005 -> pxui_role_030
006 -> pxui_role_031
007 -> pxui_role_032
008 -> pxui_role_033
009 -> pxui_role_034
010 -> pxui_role_035
```

```text
# UIATLAS_008 | 模块：角色属性图标
001 -> pxui_role_036
002 -> pxui_role_037
003 -> pxui_role_038
004 -> pxui_role_039
005 -> pxui_role_040
006 -> pxui_role_041
```

```text
# UIATLAS_009 | 模块：商店商品图标
001 -> pxui_shop_001
002 -> pxui_shop_002
003 -> pxui_shop_003
004 -> pxui_shop_004
005 -> pxui_shop_005
006 -> pxui_shop_006
007 -> pxui_shop_007
008 -> pxui_shop_008
009 -> pxui_shop_009
010 -> pxui_shop_010
011 -> pxui_shop_011
012 -> pxui_shop_012
013 -> pxui_shop_013
014 -> pxui_shop_014
015 -> pxui_shop_015
016 -> pxui_shop_016
017 -> pxui_shop_017
018 -> pxui_shop_018
019 -> pxui_shop_019
020 -> pxui_shop_020
021 -> pxui_shop_021
022 -> pxui_shop_022
023 -> pxui_shop_023
024 -> pxui_shop_024
```

```text
# UIATLAS_010 | 模块：竞赛投稿图标
001 -> pxui_competition_001
002 -> pxui_competition_002
003 -> pxui_competition_003
004 -> pxui_competition_004
005 -> pxui_competition_005
006 -> pxui_competition_006
007 -> pxui_competition_007
008 -> pxui_competition_008
009 -> pxui_competition_009
010 -> pxui_base_020
```

```text
# UIATLAS_011 | 模块：未来方向、岗位、实习、考试
001 -> pxui_route_001
002 -> pxui_route_002
003 -> pxui_route_003
004 -> pxui_route_004
005 -> pxui_route_005
006 -> pxui_route_006
007 -> pxui_route_007
008 -> pxui_route_008
009 -> pxui_route_009
010 -> pxui_route_010
011 -> pxui_route_011
012 -> pxui_route_012
013 -> pxui_route_013
014 -> pxui_route_014
015 -> pxui_route_015
016 -> pxui_route_016
017 -> pxui_route_017
018 -> pxui_route_018
019 -> pxui_route_019
020 -> pxui_route_020
021 -> pxui_route_021
022 -> pxui_route_022
023 -> pxui_route_023
024 -> pxui_route_024
025 -> pxui_route_025
026 -> pxui_route_026
027 -> pxui_route_027
028 -> pxui_route_028
029 -> pxui_route_029
030 -> pxui_route_030
031 -> pxui_route_031
032 -> pxui_route_032
033 -> pxui_route_033
034 -> pxui_route_034
035 -> pxui_route_035
036 -> pxui_route_036
037 -> pxui_route_037
038 -> pxui_route_038
039 -> pxui_route_039
040 -> pxui_route_040
041 -> pxui_route_041
042 -> pxui_route_042
```

```text
# UIATLAS_012 | 模块：成长成就图标 01
001 -> pxui_achievement_core_001
002 -> pxui_achievement_core_002
003 -> pxui_achievement_core_003
004 -> pxui_achievement_core_004
005 -> pxui_achievement_core_005
006 -> pxui_achievement_core_006
007 -> pxui_achievement_core_007
008 -> pxui_achievement_core_008
009 -> pxui_achievement_core_009
010 -> pxui_achievement_core_010
011 -> pxui_achievement_core_011
012 -> pxui_achievement_core_012
013 -> pxui_achievement_core_013
014 -> pxui_achievement_core_014
015 -> pxui_achievement_core_015
016 -> pxui_achievement_core_016
017 -> pxui_achievement_core_017
018 -> pxui_achievement_core_018
019 -> pxui_achievement_core_019
020 -> pxui_achievement_core_020
021 -> pxui_achievement_core_021
022 -> pxui_achievement_core_022
023 -> pxui_achievement_core_023
024 -> pxui_achievement_core_024
025 -> pxui_achievement_core_025
026 -> pxui_achievement_core_026
027 -> pxui_achievement_core_027
028 -> pxui_achievement_core_028
029 -> pxui_achievement_core_029
030 -> pxui_achievement_core_030
031 -> pxui_achievement_core_031
032 -> pxui_achievement_core_032
033 -> pxui_achievement_core_033
034 -> pxui_achievement_core_034
035 -> pxui_achievement_core_035
036 -> pxui_achievement_core_036
037 -> pxui_achievement_core_037
038 -> pxui_achievement_core_038
039 -> pxui_achievement_core_039
040 -> pxui_achievement_core_040
041 -> pxui_achievement_core_041
042 -> pxui_achievement_core_042
043 -> pxui_achievement_core_043
044 -> pxui_achievement_core_044
045 -> pxui_achievement_core_045
046 -> pxui_achievement_core_046
047 -> pxui_achievement_core_047
048 -> pxui_achievement_core_048
049 -> pxui_achievement_core_049
050 -> pxui_achievement_core_050
```

```text
# UIATLAS_013 | 模块：成长成就图标 02
001 -> pxui_achievement_core_051
002 -> pxui_achievement_core_052
003 -> pxui_achievement_core_053
004 -> pxui_achievement_core_054
005 -> pxui_achievement_core_055
006 -> pxui_achievement_core_056
007 -> pxui_achievement_core_057
008 -> pxui_achievement_core_058
009 -> pxui_achievement_core_059
010 -> pxui_achievement_core_060
011 -> pxui_achievement_core_061
012 -> pxui_achievement_core_062
013 -> pxui_achievement_core_063
014 -> pxui_achievement_core_064
015 -> pxui_achievement_core_065
016 -> pxui_achievement_core_066
017 -> pxui_achievement_core_067
018 -> pxui_achievement_core_068
019 -> pxui_achievement_core_069
020 -> pxui_achievement_core_070
021 -> pxui_achievement_core_071
022 -> pxui_achievement_core_072
023 -> pxui_achievement_core_073
024 -> pxui_achievement_core_074
025 -> pxui_achievement_core_075
026 -> pxui_achievement_core_076
027 -> pxui_achievement_core_077
028 -> pxui_achievement_core_078
029 -> pxui_achievement_core_079
030 -> pxui_achievement_core_080
031 -> pxui_achievement_core_081
032 -> pxui_achievement_core_082
033 -> pxui_achievement_core_083
034 -> pxui_achievement_core_084
035 -> pxui_achievement_core_085
036 -> pxui_achievement_core_086
037 -> pxui_achievement_core_087
038 -> pxui_achievement_core_088
039 -> pxui_achievement_core_089
040 -> pxui_achievement_core_090
041 -> pxui_achievement_core_091
042 -> pxui_achievement_core_092
043 -> pxui_achievement_core_093
044 -> pxui_achievement_core_094
045 -> pxui_achievement_core_095
046 -> pxui_achievement_core_096
047 -> pxui_achievement_core_097
048 -> pxui_achievement_core_098
049 -> pxui_achievement_core_099
050 -> pxui_achievement_core_100
```

```text
# UIATLAS_014 | 模块：成长成就图标 03
001 -> pxui_achievement_core_101
002 -> pxui_achievement_core_102
003 -> pxui_achievement_core_103
004 -> pxui_achievement_core_104
005 -> pxui_achievement_core_105
006 -> pxui_achievement_core_106
007 -> pxui_achievement_core_107
008 -> pxui_achievement_core_108
009 -> pxui_achievement_core_109
010 -> pxui_achievement_core_110
011 -> pxui_achievement_core_111
```

```text
# UIATLAS_015 | 模块：人生结局图标
001 -> pxui_ending_001
002 -> pxui_ending_002
003 -> pxui_ending_003
004 -> pxui_ending_004
005 -> pxui_ending_005
006 -> pxui_ending_006
007 -> pxui_ending_007
008 -> pxui_ending_008
009 -> pxui_ending_009
010 -> pxui_ending_010
011 -> pxui_ending_011
012 -> pxui_ending_012
013 -> pxui_ending_013
014 -> pxui_ending_014
015 -> pxui_ending_015
016 -> pxui_ending_016
017 -> pxui_ending_017
018 -> pxui_ending_018
019 -> pxui_ending_019
020 -> pxui_ending_020
021 -> pxui_ending_021
022 -> pxui_ending_022
023 -> pxui_ending_023
024 -> pxui_ending_024
025 -> pxui_ending_025
026 -> pxui_ending_026
027 -> pxui_ending_027
028 -> pxui_ending_028
029 -> pxui_ending_029
030 -> pxui_ending_030
031 -> pxui_ending_031
032 -> pxui_ending_032
033 -> pxui_ending_033
034 -> pxui_ending_034
035 -> pxui_ending_035
036 -> pxui_ending_036
037 -> pxui_ending_037
038 -> pxui_ending_038
039 -> pxui_ending_039
```

```text
# UIATLAS_016 | 模块：万里路地点事件
001 -> pxui_wanli_001
002 -> pxui_wanli_002
003 -> pxui_wanli_003
004 -> pxui_wanli_004
005 -> pxui_wanli_005
006 -> pxui_wanli_006
007 -> pxui_wanli_007
008 -> pxui_wanli_008
009 -> pxui_wanli_009
010 -> pxui_wanli_010
011 -> pxui_wanli_011
012 -> pxui_wanli_012
```

```text
# UIATLAS_017 | 模块：普通随机事件图标 01
001 -> pxui_random_normal_001
002 -> pxui_random_normal_002
003 -> pxui_random_normal_003
004 -> pxui_random_normal_004
005 -> pxui_random_normal_005
006 -> pxui_random_normal_006
007 -> pxui_random_normal_007
008 -> pxui_random_normal_008
009 -> pxui_random_normal_009
010 -> pxui_random_normal_010
011 -> pxui_random_normal_011
012 -> pxui_random_normal_012
013 -> pxui_random_normal_013
014 -> pxui_random_normal_014
015 -> pxui_random_normal_015
016 -> pxui_random_normal_016
017 -> pxui_random_normal_017
018 -> pxui_random_normal_018
019 -> pxui_random_normal_019
020 -> pxui_random_normal_020
021 -> pxui_random_normal_021
022 -> pxui_random_normal_022
023 -> pxui_random_normal_023
024 -> pxui_random_normal_024
025 -> pxui_random_normal_025
026 -> pxui_random_normal_026
027 -> pxui_random_normal_027
028 -> pxui_random_normal_028
029 -> pxui_random_normal_029
030 -> pxui_random_normal_030
031 -> pxui_random_normal_031
032 -> pxui_random_normal_032
033 -> pxui_random_normal_033
034 -> pxui_random_normal_034
035 -> pxui_random_normal_035
036 -> pxui_random_normal_036
037 -> pxui_random_normal_037
038 -> pxui_random_normal_038
039 -> pxui_random_normal_039
040 -> pxui_random_normal_040
041 -> pxui_random_normal_041
042 -> pxui_random_normal_042
043 -> pxui_random_normal_043
044 -> pxui_random_normal_044
045 -> pxui_random_normal_045
046 -> pxui_random_normal_046
047 -> pxui_random_normal_047
048 -> pxui_random_normal_048
049 -> pxui_random_normal_049
050 -> pxui_random_normal_050
```

```text
# UIATLAS_018 | 模块：普通随机事件图标 02
001 -> pxui_random_normal_051
002 -> pxui_random_normal_052
003 -> pxui_random_normal_053
004 -> pxui_random_normal_054
005 -> pxui_random_normal_055
006 -> pxui_random_normal_056
007 -> pxui_random_normal_057
008 -> pxui_random_normal_058
009 -> pxui_random_normal_059
010 -> pxui_random_normal_060
011 -> pxui_random_normal_061
012 -> pxui_random_normal_062
013 -> pxui_random_normal_063
014 -> pxui_random_normal_064
015 -> pxui_random_normal_065
016 -> pxui_random_normal_066
017 -> pxui_random_normal_067
018 -> pxui_random_normal_068
019 -> pxui_random_normal_069
020 -> pxui_random_normal_070
021 -> pxui_random_normal_071
022 -> pxui_random_normal_072
023 -> pxui_random_normal_073
024 -> pxui_random_normal_074
025 -> pxui_random_normal_075
026 -> pxui_random_normal_076
027 -> pxui_random_normal_077
028 -> pxui_random_normal_078
029 -> pxui_random_normal_079
030 -> pxui_random_normal_080
031 -> pxui_random_normal_081
032 -> pxui_random_normal_082
033 -> pxui_random_normal_083
034 -> pxui_random_normal_084
035 -> pxui_random_normal_085
036 -> pxui_random_normal_086
037 -> pxui_random_normal_087
038 -> pxui_random_normal_088
039 -> pxui_random_normal_089
040 -> pxui_random_normal_090
041 -> pxui_random_normal_091
042 -> pxui_random_normal_092
043 -> pxui_random_normal_093
044 -> pxui_random_normal_094
045 -> pxui_random_normal_095
046 -> pxui_random_normal_096
047 -> pxui_random_normal_097
048 -> pxui_random_normal_098
049 -> pxui_random_normal_099
050 -> pxui_random_normal_100
```

```text
# UIATLAS_019 | 模块：普通随机事件图标 03
001 -> pxui_random_normal_101
002 -> pxui_random_normal_102
003 -> pxui_random_normal_103
004 -> pxui_random_normal_104
005 -> pxui_random_normal_105
006 -> pxui_random_normal_106
007 -> pxui_random_normal_107
008 -> pxui_random_normal_108
009 -> pxui_random_normal_109
010 -> pxui_random_normal_110
011 -> pxui_random_normal_111
012 -> pxui_random_normal_112
013 -> pxui_random_normal_113
014 -> pxui_random_normal_114
015 -> pxui_random_normal_115
016 -> pxui_random_normal_116
017 -> pxui_random_normal_117
018 -> pxui_random_normal_118
019 -> pxui_random_normal_119
020 -> pxui_random_normal_120
021 -> pxui_random_normal_121
022 -> pxui_random_normal_122
023 -> pxui_random_normal_123
024 -> pxui_random_normal_124
025 -> pxui_random_normal_125
026 -> pxui_random_normal_126
027 -> pxui_random_normal_127
028 -> pxui_random_normal_128
029 -> pxui_random_normal_129
030 -> pxui_random_normal_130
031 -> pxui_random_normal_131
032 -> pxui_random_normal_132
033 -> pxui_random_normal_133
034 -> pxui_random_normal_134
035 -> pxui_random_normal_135
036 -> pxui_random_normal_136
037 -> pxui_random_normal_137
038 -> pxui_random_normal_138
039 -> pxui_random_normal_139
040 -> pxui_random_normal_140
041 -> pxui_random_normal_141
042 -> pxui_random_normal_142
043 -> pxui_random_normal_143
```

```text
# UIATLAS_020 | 模块：交互事件图标
001 -> pxui_random_interactive_001
002 -> pxui_random_interactive_002
003 -> pxui_random_interactive_003
004 -> pxui_random_interactive_004
005 -> pxui_random_interactive_005
006 -> pxui_random_interactive_006
007 -> pxui_random_interactive_007
008 -> pxui_random_interactive_008
009 -> pxui_random_interactive_009
010 -> pxui_random_interactive_010
011 -> pxui_random_interactive_011
012 -> pxui_random_interactive_012
013 -> pxui_random_interactive_013
014 -> pxui_random_interactive_014
015 -> pxui_random_interactive_015
016 -> pxui_random_interactive_016
017 -> pxui_random_interactive_017
018 -> pxui_random_interactive_018
019 -> pxui_random_interactive_019
020 -> pxui_random_interactive_020
021 -> pxui_random_interactive_021
022 -> pxui_random_interactive_022
023 -> pxui_random_interactive_023
024 -> pxui_random_interactive_024
025 -> pxui_random_interactive_025
026 -> pxui_random_interactive_026
027 -> pxui_random_interactive_027
028 -> pxui_random_interactive_028
029 -> pxui_random_interactive_029
030 -> pxui_random_interactive_030
031 -> pxui_random_interactive_031
032 -> pxui_random_interactive_032
033 -> pxui_random_interactive_033
034 -> pxui_random_interactive_034
035 -> pxui_random_interactive_035
036 -> pxui_random_interactive_036
037 -> pxui_random_interactive_037
038 -> pxui_random_interactive_038
039 -> pxui_random_interactive_039
040 -> pxui_random_interactive_040
041 -> pxui_random_interactive_041
042 -> pxui_random_interactive_042
043 -> pxui_random_interactive_043
044 -> pxui_random_interactive_044
045 -> pxui_random_interactive_045
046 -> pxui_random_interactive_046
047 -> pxui_random_interactive_047
048 -> pxui_random_interactive_048
049 -> pxui_random_interactive_049
```

```text
# UIATLAS_021 | 模块：模型周事件图标
001 -> pxui_random_model_001
002 -> pxui_random_model_002
003 -> pxui_random_model_003
004 -> pxui_random_model_004
005 -> pxui_random_model_005
006 -> pxui_random_model_006
007 -> pxui_random_model_007
008 -> pxui_random_model_008
009 -> pxui_random_model_009
010 -> pxui_random_model_010
011 -> pxui_random_model_011
012 -> pxui_random_model_012
```

```text
# UIATLAS_022 | 模块：事件弹窗与徽章状态
001 -> pxui_event_badge_001
002 -> pxui_event_badge_002
003 -> pxui_event_badge_003
004 -> pxui_event_badge_004
005 -> pxui_event_badge_005
006 -> pxui_event_badge_006
007 -> pxui_event_badge_007
008 -> pxui_event_badge_008
009 -> pxui_event_badge_009
010 -> pxui_event_badge_010
011 -> pxui_event_badge_011
012 -> pxui_event_badge_012
013 -> pxui_event_badge_013
014 -> pxui_event_badge_014
015 -> pxui_event_badge_015
016 -> pxui_event_badge_016
017 -> pxui_event_badge_017
018 -> pxui_event_badge_018
019 -> pxui_event_badge_019
020 -> pxui_event_badge_020
021 -> pxui_event_badge_021
022 -> pxui_event_badge_022
023 -> pxui_event_badge_023
024 -> pxui_event_badge_024
025 -> pxui_event_badge_025
026 -> pxui_event_badge_026
027 -> pxui_event_badge_027
028 -> pxui_event_badge_028
029 -> pxui_event_badge_029
030 -> pxui_event_badge_030
```

```text
# UIATLAS_023 | 模块：专辑圆形 UI 图标
001 -> pxui_album_001
002 -> pxui_album_002
003 -> pxui_album_003
004 -> pxui_album_004
005 -> pxui_album_005
006 -> pxui_album_006
007 -> pxui_album_007
008 -> pxui_album_008
009 -> pxui_album_009
010 -> pxui_album_010
011 -> pxui_album_011
012 -> pxui_album_012
013 -> pxui_album_013
014 -> pxui_album_014
015 -> pxui_album_015
016 -> pxui_album_016
017 -> pxui_album_017
018 -> pxui_album_018
019 -> pxui_album_019
020 -> pxui_album_020
021 -> pxui_album_021
022 -> pxui_album_022
023 -> pxui_album_023
025 -> pxui_album_025
026 -> pxui_album_026
027 -> pxui_album_027
028 -> pxui_album_028
029 -> pxui_album_029
030 -> pxui_album_030
031 -> pxui_album_031
032 -> pxui_album_032
033 -> pxui_album_033
034 -> pxui_album_034
035 -> pxui_album_035
036 -> pxui_album_036
037 -> pxui_album_037
038 -> pxui_album_038
039 -> pxui_album_039
040 -> pxui_album_040
041 -> pxui_album_041
042 -> pxui_album_042
043 -> pxui_album_043
044 -> pxui_album_044
045 -> pxui_album_045
046 -> pxui_album_046
```

```text
# UIATLAS_001 | 模块：基础操作按钮 | 2048x2048 | 48 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，基础操作按钮默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有确认、警告、锁槽、页角、清单等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；确认、警告、特殊状态只用少量绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 播放三角
002 icon(560,208,128,128) 右箭头
003 icon(704,208,128,128) 文件夹+读取箭头
004 icon(848,208,128,128) 新草地方块
005 icon(992,208,128,128) 循环箭头
006 icon(1136,208,128,128) 存档盒+勾
007 icon(1280,208,128,128) 存档盒
008 icon(416,352,128,128) 门
009 icon(560,352,128,128) 左箭头
010 icon(704,352,128,128) 右箭头
011 icon(848,352,128,128) 小屋+草地方块
012 icon(992,352,128,128) 三横方块菜单
013 icon(1136,352,128,128) 三个方块点
014 icon(1280,352,128,128) 向下箭头
015 icon(416,496,128,128) 向上箭头
016 icon(560,496,128,128) 左页角+左箭头
017 icon(704,496,128,128) 右页角
018 icon(848,496,128,128) 交叉方块
019 icon(992,496,128,128) 绿色勾
020 icon(1136,496,128,128) 红色叉
021 icon(1280,496,128,128) 勾章
022 icon(416,640,128,128) 双快进箭头
023 icon(560,640,128,128) 右箭头+脚印
024 icon(704,640,128,128) 奖章
025 icon(848,640,128,128) 手接信封礼包
026 icon(992,640,128,128) 加号
027 icon(1136,640,128,128) 减号
028 icon(1280,640,128,128) 上箭头
029 icon(416,784,128,128) 下箭头+滑杆
030 icon(560,784,128,128) 回转箭头
031 icon(704,784,128,128) 双循环刷新箭头
032 icon(848,784,128,128) 放大镜
033 icon(992,784,128,128) 漏斗+小方块
034 icon(1136,784,128,128) 上下箭头
035 icon(1280,784,128,128) 向下箭头
036 icon(416,928,128,128) 向上箭头+托盘
037 icon(560,928,128,128) 文件进入盒子
038 icon(704,928,128,128) 文件离开盒子
039 icon(848,928,128,128) 闭合锁头
040 icon(992,928,128,128) 打开锁头
041 icon(1136,928,128,128) 眼睛
042 icon(1280,928,128,128) 蒙布盖住眼睛
043 icon(416,1072,128,128) 喇叭
044 icon(560,1072,128,128) 喇叭+声波
045 icon(704,1072,128,128) 救生圈
046 icon(848,1072,128,128) 卷轴
047 icon(992,1072,128,128) 红色警示三角+火花
048 icon(1136,1072,128,128) 破裂红水晶
```

```text
# UIATLAS_002 | 模块：状态数值与反馈 | 2048x2048 | 38 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 电池
002 icon(560,208,128,128) 压力表+红色指针
003 icon(704,208,128,128) 金币
004 icon(848,208,128,128) 钱袋
005 icon(992,208,128,128) 脚印+行动点
006 icon(1136,208,128,128) 大电池
007 icon(1280,208,128,128) 蓝图进度条
008 icon(416,352,128,128) 图纸
009 icon(560,352,128,128) 作品册+奖章
010 icon(704,352,128,128) 成绩册
011 icon(848,352,128,128) 展板
012 icon(992,352,128,128) 试卷+铅笔
013 icon(1136,352,128,128) 草图
014 icon(1280,352,128,128) 芯片
015 icon(416,496,128,128) 色板+星光
016 icon(560,496,128,128) 麦克风
017 icon(704,496,128,128) 两个人影
018 icon(848,496,128,128) 盾牌+压力表
019 icon(992,496,128,128) 空钱袋
020 icon(1136,496,128,128) 低电量电池
021 icon(1280,496,128,128) 爆表压力表+红火花
022 icon(416,640,128,128) 断裂图纸
023 icon(560,640,128,128) 绿勾奖章
024 icon(704,640,128,128) 破碎印章
025 icon(848,640,128,128) 上箭头
026 icon(992,640,128,128) 下箭头+暗色碎片
027 icon(1136,640,128,128) 平衡横杆
028 icon(1280,640,128,128) 遮布方块
029 icon(416,784,128,128) 勾选清单
030 icon(560,784,128,128) 空清单
031 icon(704,784,128,128) 绿色可用开关
032 icon(848,784,128,128) 灰色禁用锁
033 icon(992,784,128,128) 高亮边框+勾
034 icon(1136,784,128,128) 购物袋
035 icon(1280,784,128,128) 奖杯
036 icon(416,928,128,128) 分岔路+星币
037 icon(560,928,128,128) 排行榜台阶
038 icon(704,928,128,128) 平静笑脸
```

```text
# UIATLAS_003 | 模块：系统入口图标 | 2048x2048 | 42 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 新草地方块
002 icon(560,208,128,128) 表单纸+铅笔
003 icon(704,208,128,128) 三张头像卡
004 icon(848,208,128,128) 横向阶段条
005 icon(992,208,128,128) 周历格
006 icon(1136,208,128,128) 超市手推车
007 icon(1280,208,128,128) 冠军奖杯
008 icon(416,352,128,128) 分岔路图鉴书
009 icon(560,352,128,128) 领奖台
010 icon(704,352,128,128) 存档盒
011 icon(848,352,128,128) 齿轮+扳手
012 icon(992,352,128,128) 作品册+简历纸
013 icon(1136,352,128,128) 信箱+图纸
014 icon(1280,352,128,128) 工牌
015 icon(416,496,128,128) 地图+远行路标
016 icon(560,496,128,128) 讲台
017 icon(704,496,128,128) 唱片+播放三角
018 icon(848,496,128,128) 指路牌
019 icon(992,496,128,128) 喇叭
020 icon(1136,496,128,128) 建筑学院楼+聊天泡
021 icon(1280,496,128,128) 咖啡杯+爱心
022 icon(416,640,128,128) 出口箭头
023 icon(560,640,128,128) 月亮+深色方块
024 icon(704,640,128,128) 太阳+浅色方块
025 icon(848,640,128,128) 地球
026 icon(992,640,128,128) 辅助圆环+伸手
027 icon(1136,640,128,128) 日记本
028 icon(1280,640,128,128) 展板
029 icon(416,784,128,128) 简历纸+工牌
030 icon(560,784,128,128) 本子+钢笔
031 icon(704,784,128,128) 毕业帽
032 icon(848,784,128,128) 毕业穗的对称图标
033 icon(992,784,128,128) 红旗+公文包
034 icon(1136,784,128,128) 护照+飞机
035 icon(1280,784,128,128) 岔路牌
036 icon(416,928,128,128) 纯蓝色CAD软件图标
037 icon(560,928,128,128) 纯蓝色SU软件图标
038 icon(704,928,128,128) 纯蓝色PS软件图标
039 icon(848,928,128,128) 事件记录卡+图钉
040 icon(992,928,128,128) 思想者雕塑
041 icon(1136,928,128,128) 建筑学院楼+台灯
042 icon(1280,928,128,128) 流程节点+齿轮
```

```text
# UIATLAS_004 | 模块：周行动、项目、评图、模型 | 2048x2048 | 30 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 发光电脑屏幕
002 icon(560,208,128,128) 打开的书+展览票
003 icon(704,208,128,128) 草图纸
004 icon(848,208,128,128) 地图
005 icon(992,208,128,128) 图板+丁字尺
006 icon(1136,208,128,128) 夜灯
007 icon(1280,208,128,128) 哑铃
008 icon(416,352,128,128) 饭碗+饮料
009 icon(560,352,128,128) 床
010 icon(704,352,128,128) 合同
011 icon(848,352,128,128) 工牌+零钱
012 icon(992,352,128,128) 发光技能星
013 icon(1136,352,128,128) 钢笔
014 icon(1280,352,128,128) 制图软件底图+描线光标
015 icon(416,496,128,128) 模型小屋
016 icon(560,496,128,128) 体块建模方块
017 icon(704,496,128,128) 渲染窗口+太阳
018 icon(848,496,128,128) 曲面网格
019 icon(992,496,128,128) 成套图纸
020 icon(1136,496,128,128) 传单叠+街角箭头
021 icon(1280,496,128,128) 书架
022 icon(416,640,128,128) 外卖箱
023 icon(560,640,128,128) 黑板+粉笔
024 icon(704,640,128,128) 聚光灯下的演讲台
025 icon(848,640,128,128) 参数节点
026 icon(992,640,128,128) 双手合十
027 icon(1136,640,128,128) 投影幕+翻页箭头
028 icon(1280,640,128,128) 美工刀
029 icon(416,784,128,128) 激光头
030 icon(560,784,128,128) 打印喷头+小模型
```

```text
# UIATLAS_005 | 模块：角色与老师头像 | 2048x2048 | 18 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块人像素风，默认画成单独头像内容，不额外画方框、按钮底板或外框；只有角色卡/头像卡要求承载形状时才画框。黑白灰为主，服装和道具只用少量低饱和识别色；头像必须完全正面，方块人半身或头像居中。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占104-120px，单图标通常1个角色头像，必要时1个小道具；禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏头像质感。
001 icon(416,208,128,128) 完全正面+普通建筑学生+白T恤+黑框眼镜+背着图纸筒+我的世界方块人头像
002 icon(560,208,128,128) 完全正面+松弛学生+耳机+游戏手柄+乱发+我的世界方块人头像
003 icon(704,208,128,128) 完全正面+微笑学生+创可贴+轻松表情+扛着图纸+我的世界方块人头像
004 icon(848,208,128,128) 完全正面+天才设计学生+围巾+草图本+自信眼神+我的世界方块人头像
005 icon(992,208,128,128) 完全正面+朴素学生+旧书包+坚定表情+手握铅笔+我的世界方块人头像
006 icon(1136,208,128,128) 完全正面+疲惫学生+黑眼圈+工牌+红牛罐+我的世界方块人头像
007 icon(1280,208,128,128) 完全正面+商业感学生+衬衫+计算器+建材样本+我的世界方块人头像
008 icon(416,352,128,128) 完全正面+富二代学生+墨镜+车钥匙+名牌背包+我的世界方块人头像
009 icon(560,352,128,128) 完全正面+院士家庭学生+凌乱头发+叛逆表情+旧讲义+我的世界方块人头像
010 icon(704,352,128,128) 完全正面+学霸学生+厚笔记+荧光笔+认真眼神+我的世界方块人头像
011 icon(848,352,128,128) 完全正面+建筑世家学生+圆眼镜+模型方块+优雅姿态+我的世界方块人头像
012 icon(992,352,128,128) 完全正面+景观实践导师+草帽+卷尺+场地草图+我的世界方块人头像
013 icon(1136,352,128,128) 完全正面+学院派女博士导师+短发+书本+温和眼神+我的世界方块人头像
014 icon(1280,352,128,128) 完全正面+高压审美导师+黑衣+红笔+锐利眼神+我的世界方块人头像
015 icon(416,496,128,128) 完全正面+人本主义导师+圆眼镜+人物草图+温暖表情+我的世界方块人头像
016 icon(560,496,128,128) 完全正面+软件技术导师+电脑屏幕+参数节点+蓝色像素光+我的世界方块人头像
017 icon(704,496,128,128) 完全正面+佛系放养导师+保温杯+淡定表情+简洁草图+我的世界方块人头像
018 icon(848,496,128,128) 完全正面+竞赛压力导师+奖杯+红笔+严厉表情+我的世界方块人头像
```

```text
# UIATLAS_006 | 模块：导师阶段任务 | 2048x2048 | 7 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 场地小旗+鞋印+外包合同
002 icon(560,208,128,128) 书本托起建筑块
003 icon(704,208,128,128) 砂纸+红笔+被修正图纸
004 icon(848,208,128,128) 人形尺度站在平面图中
005 icon(992,208,128,128) 节点网络+插件齿轮+蓝色火花
006 icon(1136,208,128,128) 节拍器+进度条+台灯
007 icon(1280,208,128,128) 奖杯+投稿信封+火焰
```

```text
# UIATLAS_007 | 模块：课程图标 | 2048x2048 | 10 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 古典柱+建筑史书+时间卷轴
002 icon(560,208,128,128) 墙身剖面+节点螺栓+构造图
003 icon(704,208,128,128) 网格地图+数据点+发光路径
004 icon(848,208,128,128) 制图软件光标+显示器+立方体
005 icon(992,208,128,128) 梁+受力箭头+结构支点
006 icon(1136,208,128,128) 画笔
007 icon(1280,208,128,128) 丁字尺
008 icon(416,352,128,128) 麦克风+投影幕
009 icon(560,352,128,128) 构图框
010 icon(704,352,128,128) 园林窗
```

```text
# UIATLAS_008 | 模块：角色属性图标 | 2048x2048 | 6 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 草图+方块模型
002 icon(560,208,128,128) 芯片
003 icon(704,208,128,128) 调色盘
004 icon(848,208,128,128) 麦克风+投影幕
005 icon(992,208,128,128) 双人头像
006 icon(1136,208,128,128) 盾牌
```

```text
# UIATLAS_009 | 模块：商店商品图标 | 2048x2048 | 24 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 炸鸡桶+红白包装
002 icon(560,208,128,128) 能量饮料罐
003 icon(704,208,128,128) 眼药水小瓶
004 icon(848,208,128,128) 唱片会员卡+音符图案
005 icon(992,208,128,128) 肩颈按摩仪
006 icon(1136,208,128,128) 咖啡会员卡
007 icon(1280,208,128,128) 折叠床+蓝色帆布
008 icon(416,352,128,128) 对话气泡
009 icon(560,352,128,128) 健身会员卡
010 icon(704,352,128,128) 请假纸条+红色印章
011 icon(848,352,128,128) 速写本
012 icon(992,352,128,128) 马克笔盒
013 icon(1136,352,128,128) 半透明描图纸卷+蓝色线稿叠影
014 icon(1280,352,128,128) 建筑书
015 icon(416,496,128,128) 建筑史书
016 icon(560,496,128,128) 软件插件卡+齿轮
017 icon(704,496,128,128) 哲学书
018 icon(848,496,128,128) 作品集画册
019 icon(992,496,128,128) 数位板+触控笔
020 icon(1136,496,128,128) 模型工具箱
021 icon(1280,496,128,128) 头戴耳机
022 icon(416,640,128,128) 人体工学椅+黑灰配色
023 icon(560,640,128,128) 人体工学鼠标
024 icon(704,640,128,128) 高性能笔记本
```

```text
# UIATLAS_010 | 模块：竞赛投稿图标 | 2048x2048 | 10 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 校园角落+更新图纸
002 icon(560,208,128,128) 老街区+小模型
003 icon(704,208,128,128) 绿色建筑+叶子
004 icon(848,208,128,128) 青年建筑师作品册
005 icon(992,208,128,128) 展板+上箭头
006 icon(1136,208,128,128) 入围名单+星星
007 icon(1280,208,128,128) 金奖杯
008 icon(416,352,128,128) 银奖杯
009 icon(560,352,128,128) 铜奖杯
010 icon(704,352,128,128) 红色叉号；运行时复用 UIATLAS_001_020_pxui_base_020_叉
```

```text
# UIATLAS_011 | 模块：未来方向、岗位、实习、考试 | 2048x2048 | 42 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 报名表
002 icon(560,208,128,128) 信封+沙漏
003 icon(704,208,128,128) 简历纸
004 icon(848,208,128,128) 建筑题本
005 icon(992,208,128,128) 答题卡
006 icon(1136,208,128,128) 英文试卷
007 icon(1280,208,128,128) 本校校门+录取信
008 icon(416,352,128,128) 名校校门
009 icon(560,352,128,128) 殿堂校门
010 icon(704,352,128,128) 普通校门+书本
011 icon(848,352,128,128) 名校校门+书堆
012 icon(992,352,128,128) 殿堂校门+书堆
013 icon(1136,352,128,128) 护照+小校门
014 icon(1280,352,128,128) 护照+红砖校门
015 icon(416,496,128,128) 护照+高楼校门
016 icon(560,496,128,128) 护照+皇冠校门
017 icon(704,496,128,128) 家乡路牌+红旗
018 icon(848,496,128,128) 国徽感办公楼
019 icon(992,496,128,128) 城市办公楼
020 icon(1136,496,128,128) 乡镇街道+路灯
021 icon(1280,496,128,128) 讲台
022 icon(416,640,128,128) 规划馆沙盘
023 icon(560,640,128,128) 文件+印章
024 icon(704,640,128,128) 普通工牌
025 icon(848,640,128,128) 蓝色工牌+模型
026 icon(992,640,128,128) 金色工牌+高楼
027 icon(1136,640,128,128) 邮箱+工牌
028 icon(1280,640,128,128) 杂志级项目模型
029 icon(416,784,128,128) 英文邮件+玻璃楼
030 icon(560,784,128,128) 施工图
031 icon(704,784,128,128) 地方项目蓝图
032 icon(848,784,128,128) 小工作桌+模型
033 icon(992,784,128,128) 产品看板+芯片
034 icon(1136,784,128,128) 游戏场景方块
035 icon(1280,784,128,128) 户型图+握手
036 icon(416,928,128,128) 推文编辑器
037 icon(560,928,128,128) 画笔
038 icon(704,928,128,128) 火苗+契约
039 icon(848,928,128,128) 复习书堆
040 icon(992,928,128,128) 行测书
041 icon(1136,928,128,128) 行李箱
042 icon(1280,928,128,128) 等待邮件
```

```text
# UIATLAS_012 | 模块：成长成就图标 01 | 2048x2048 | 50 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 校门+新书包
002 icon(560,208,128,128) 丁字尺+第一线
003 icon(704,208,128,128) 草图灯泡
004 icon(848,208,128,128) 地图+脚印
005 icon(992,208,128,128) 学期日历
006 icon(1136,208,128,128) 学年日历+星
007 icon(1280,208,128,128) 毕业帽+证书
008 icon(416,352,128,128) 夜灯+图纸
009 icon(560,352,128,128) 三盏夜灯
010 icon(704,352,128,128) 王冠夜灯
011 icon(848,352,128,128) 课程清单
012 icon(992,352,128,128) 满分试卷
013 icon(1136,352,128,128) 评图展板
014 icon(1280,352,128,128) 灰色成绩单+绿勾
015 icon(416,496,128,128) 认可展板
016 icon(560,496,128,128) 精良展板
017 icon(704,496,128,128) 星级展板
018 icon(848,496,128,128) 双勾展板
019 icon(992,496,128,128) 双星章
020 icon(1136,496,128,128) 无挂科日历
021 icon(1280,496,128,128) 四学期日历
022 icon(416,640,128,128) 红色低分成绩单
023 icon(560,640,128,128) 低分到绿勾
024 icon(704,640,128,128) 及格线成绩单
025 icon(848,640,128,128) 麦克风+上箭头
026 icon(992,640,128,128) 导师点头
027 icon(1136,640,128,128) 三次导师勾
028 icon(1280,640,128,128) 模型+绿勾
029 icon(416,784,128,128) 逆风箭头+展板
030 icon(560,784,128,128) 作品集小册
031 icon(704,784,128,128) 顶尖作品册
032 icon(848,784,128,128) 皇冠作品册
033 icon(992,784,128,128) 投稿展板
034 icon(1136,784,128,128) 铜奖杯
035 icon(1280,784,128,128) 银奖杯
036 icon(416,928,128,128) 金奖杯
037 icon(560,928,128,128) 双奖杯
038 icon(704,928,128,128) 实习工牌
039 icon(848,928,128,128) 录用信
040 icon(992,928,128,128) 简历三标签
041 icon(1136,928,128,128) 设计三角尺
042 icon(1280,928,128,128) 芯片
043 icon(416,1072,128,128) 调色盘
044 icon(560,1072,128,128) 麦克风
045 icon(704,1072,128,128) 双人对话
046 icon(848,1072,128,128) 盾牌
047 icon(992,1072,128,128) 建筑世家圆眼镜
048 icon(1136,1072,128,128) 六边形徽章
049 icon(1280,1072,128,128) 角色卡组
050 icon(416,1216,128,128) 导师卡组
```

```text
# UIATLAS_013 | 模块：成长成就图标 02 | 2048x2048 | 50 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 四项满级星
002 icon(560,208,128,128) AI芯片问候
003 icon(704,208,128,128) AI产品看板
004 icon(848,208,128,128) 远行路牌
005 icon(992,208,128,128) 模型周行李箱
006 icon(1136,208,128,128) 五城地图
007 icon(1280,208,128,128) 长路线地图
008 icon(416,352,128,128) 写生画板
009 icon(560,352,128,128) 补给包
010 icon(704,352,128,128) 稳定钱袋
011 icon(848,352,128,128) 高性能笔记本
012 icon(992,352,128,128) AI电脑双击
013 icon(1136,352,128,128) 展览票双击
014 icon(1280,352,128,128) 草图双灯泡
015 icon(416,496,128,128) 泥鞋+地图
016 icon(560,496,128,128) 磨平鞋底
017 icon(704,496,128,128) 哑铃
018 icon(848,496,128,128) 铁人奖章
019 icon(992,496,128,128) 聚餐桌
020 icon(1136,496,128,128) 社交彩灯
021 icon(1280,496,128,128) 孤独图纸
022 icon(416,640,128,128) 枕头
023 icon(560,640,128,128) 躺椅
024 icon(704,640,128,128) 第一枚金币
025 icon(848,640,128,128) 外包合同三份
026 icon(992,640,128,128) 高速CAD金币
027 icon(1136,640,128,128) 兼职工牌
028 icon(1280,640,128,128) 外卖电动车
029 icon(416,784,128,128) 满购物袋
030 icon(560,784,128,128) 咖啡三杯
031 icon(704,784,128,128) 咖啡六杯
032 icon(848,784,128,128) 咖啡心电图
033 icon(992,784,128,128) 炸鸡桶+王冠
034 icon(1136,784,128,128) 巨型炸鸡桶+金王冠
035 icon(1280,784,128,128) 美食印章
036 icon(416,928,128,128) 人体工学椅
037 icon(560,928,128,128) 唱片会员卡
038 icon(704,928,128,128) 咖啡杯+星星
039 icon(848,928,128,128) 爱心
040 icon(992,928,128,128) 裂开爱心+图纸
041 icon(1136,928,128,128) 雨伞+援手
042 icon(1280,928,128,128) 红色压力表
043 icon(416,1072,128,128) 低电量电池
044 icon(560,1072,128,128) 空电池
045 icon(704,1072,128,128) 高压盾牌
046 icon(848,1072,128,128) 推免申请表
047 icon(992,1072,128,128) 考研书堆
048 icon(1136,1072,128,128) 英文试卷
049 icon(1280,1072,128,128) 护照+申请信
050 icon(416,1216,128,128) 红旗路牌
```

```text
# UIATLAS_014 | 模块：成长成就图标 03 | 2048x2048 | 11 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 公文包+铁碗
002 icon(560,208,128,128) 编制文件
003 icon(704,208,128,128) 建筑工牌
004 icon(848,208,128,128) 大师外企高楼
005 icon(992,208,128,128) 岔路牌
006 icon(1136,208,128,128) 结局卡组
007 icon(1280,208,128,128) 分岔图鉴册
008 icon(416,352,128,128) 全结局皇冠
009 icon(560,352,128,128) 厚成就册
010 icon(704,352,128,128) 百科成就书
011 icon(848,352,128,128) 全成就皇冠
```

```text
# UIATLAS_015 | 模块：人生结局图标 | 2048x2048 | 39 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 本校录取信
002 icon(560,208,128,128) 落选名单+灰色信封
003 icon(704,208,128,128) 名校校门
004 icon(848,208,128,128) 研究生录取信
005 icon(992,208,128,128) 复习书堆+第二年标签
006 icon(1136,208,128,128) 护照
007 icon(1280,208,128,128) 海外录取邮件
008 icon(416,352,128,128) 护照+飞机
009 icon(560,352,128,128) 保底录取信
010 icon(704,352,128,128) 拒信
011 icon(848,352,128,128) 乡镇路牌+红旗
012 icon(992,352,128,128) 国徽感办公楼
013 icon(1136,352,128,128) 城市办公楼
014 icon(1280,352,128,128) 讲台+黑板
015 icon(416,496,128,128) 规划馆沙盘
016 icon(560,496,128,128) 文件堆
017 icon(704,496,128,128) 基层小广场+红旗
018 icon(848,496,128,128) 行测书
019 icon(992,496,128,128) 行李箱
020 icon(1136,496,128,128) 大师事务所高楼+安全帽
021 icon(1280,496,128,128) 英文工牌
022 icon(416,640,128,128) 国企设计院楼
023 icon(560,640,128,128) 地方设计院楼+图纸卷
024 icon(704,640,128,128) 小工作室
025 icon(848,640,128,128) 等待邮件
026 icon(992,640,128,128) 机器人头像+产品看板
027 icon(1136,640,128,128) 游戏场景方块
028 icon(1280,640,128,128) 商务名片
029 icon(416,784,128,128) 文章页面+羽毛笔
030 icon(560,784,128,128) 画笔
031 icon(704,784,128,128) 火箭
032 icon(848,784,128,128) 被退回的简历+灰色路牌
033 icon(992,784,128,128) 毕业证
034 icon(1136,784,128,128) 毕业证
035 icon(1280,784,128,128) 延毕通知+裂开的毕业帽
036 icon(416,928,128,128) 空钱包
037 icon(560,928,128,128) 红色压力表
038 icon(704,928,128,128) 低分成绩单+退学信
039 icon(848,928,128,128) 空电池
```

```text
# UIATLAS_016 | 模块：万里路地点事件 | 2048x2048 | 12 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 光十字教堂
002 icon(560,208,128,128) 弯顶白教堂
003 icon(704,208,128,128) 白色现代别墅
004 icon(848,208,128,128) 玻璃小屋
005 icon(992,208,128,128) 包豪斯校舍
006 icon(1136,208,128,128) 海边研究院
007 icon(1280,208,128,128) 拱顶美术馆
008 icon(416,352,128,128) 白墙灰瓦博物馆
009 icon(560,352,128,128) 三角高楼
010 icon(704,352,128,128) 双石块剧院
011 icon(848,352,128,128) 瀑布别墅
012 icon(992,352,128,128) 阶梯学院楼
```

```text
# UIATLAS_017 | 模块：普通随机事件图标 01 | 2048x2048 | 50 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 断裂存档盒+闪电
002 icon(560,208,128,128) 混乱图层面板
003 icon(704,208,128,128) 迷路苍蝇+参考图
004 icon(848,208,128,128) 趴睡绘图板
005 icon(992,208,128,128) 更新窗口+重启箭头
006 icon(1136,208,128,128) 被涂改方案图
007 icon(1280,208,128,128) 巨大手掌压图纸
008 icon(416,352,128,128) 吹牛对话泡+空图纸
009 icon(560,352,128,128) 抢功手指+图纸
010 icon(704,352,128,128) 翻倒讲台+平面图
011 icon(848,352,128,128) 崩溃CAD窗口
012 icon(992,352,128,128) 梦话气泡+尺寸线
013 icon(1136,352,128,128) 点名册+红笔
014 icon(1280,352,128,128) 老旧软件窗口+AI芯片
015 icon(416,496,128,128) 红笔重做图纸
016 icon(560,496,128,128) 两张相同方案图
017 icon(704,496,128,128) 咖啡泼洒图纸
018 icon(848,496,128,128) 裂开硬盘
019 icon(992,496,128,128) 纸巾+温度计
020 icon(1136,496,128,128) 冒烟风扇
021 icon(1280,496,128,128) 语音气泡+计时条
022 icon(416,640,128,128) 洗面奶牙刷
023 icon(560,640,128,128) 七张叠放草图
024 icon(704,640,128,128) 跑偏平面图+警示牌
025 icon(848,640,128,128) 总图变床
026 icon(992,640,128,128) 手机动态+导师点赞
027 icon(1136,640,128,128) 小勾评价卡
028 icon(1280,640,128,128) 凌晨时钟+专教灯
029 icon(416,784,128,128) 群聊气泡+月亮
030 icon(560,784,128,128) 空进度条+导师红笔
031 icon(704,784,128,128) 超时计时器+PPT
032 icon(848,784,128,128) 断裂椅子
033 icon(992,784,128,128) 同粗线稿
034 icon(1136,784,128,128) 案例书+红笔
035 icon(1280,784,128,128) 案例书堆+对话泡
036 icon(416,928,128,128) 尺寸错误材料板
037 icon(560,928,128,128) AI芯片+图纸
038 icon(704,928,128,128) 封面红圈批注
039 icon(848,928,128,128) 姓名栏红圈批注
040 icon(992,928,128,128) 崩溃犀牛建模窗口
041 icon(1136,928,128,128) 鼠标手滑+撤销箭头
042 icon(1280,928,128,128) 大师剪影+黑丝带
043 icon(416,1072,128,128) 延迟包裹+时钟
044 icon(560,1072,128,128) 游戏手柄+五杀气泡
045 icon(704,1072,128,128) 颈椎骨+闪电
046 icon(848,1072,128,128) 病毒插件齿轮
047 icon(992,1072,128,128) 甲方红章+三轮修改
048 icon(1136,1072,128,128) 旧风格图纸+灰尘
049 icon(1280,1072,128,128) 歪比例尺+平面图
050 icon(416,1216,128,128) 歪柱网
```

```text
# UIATLAS_018 | 模块：普通随机事件图标 02 | 2048x2048 | 50 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 断裂楼梯
002 icon(560,208,128,128) 无窗立面
003 icon(704,208,128,128) 反贴材质板
004 icon(848,208,128,128) 抽筋手掌+鼠标
005 icon(992,208,128,128) 迟到闹钟+黑眼圈
006 icon(1136,208,128,128) 空电池+电源插头
007 icon(1280,208,128,128) 已读气泡+沉默头像
008 icon(416,352,128,128) AI皇冠+渲染图
009 icon(560,352,128,128) 图片生成模型窗口
010 icon(704,352,128,128) 点名单+聚光灯
011 icon(848,352,128,128) 转专业路牌+背包
012 icon(992,352,128,128) 低落学生+碎图纸
013 icon(1136,352,128,128) 断水饮水机
014 icon(1280,352,128,128) 跑道+疲惫学生
015 icon(416,496,128,128) 空胶水位
016 icon(560,496,128,128) 断裂针管笔
017 icon(704,496,128,128) 刮穿图纸+刀片
018 icon(848,496,128,128) 大厂工牌+改图桌
019 icon(992,496,128,128) 空白简历
020 icon(1136,496,128,128) 电话+考公路牌
021 icon(1280,496,128,128) 加倍深度图纸
022 icon(416,640,128,128) 英文单词书+汗滴
023 icon(560,640,128,128) 保研线天平
024 icon(704,640,128,128) 两本相同作品集
025 icon(848,640,128,128) 倒计时日历+专教灯
026 icon(992,640,128,128) 教学视频播放窗
027 icon(1136,640,128,128) 浴室灯泡+平面图
028 icon(1280,640,128,128) 老友消息气泡
029 icon(416,784,128,128) 展览票+画框
030 icon(560,784,128,128) 红牛罐+夜灯
031 icon(704,784,128,128) 红笔点赞图纸
032 icon(848,784,128,128) 凌晨红牛+陪伴剪影
033 icon(992,784,128,128) 饭盒+援手
034 icon(1136,784,128,128) 提前包裹+绿勾
035 icon(1280,784,128,128) 老师点头+图纸
036 icon(416,928,128,128) 一遍过图纸+绿章
037 icon(560,928,128,128) 奶茶杯
038 icon(704,928,128,128) 安慰手掌+学生
039 icon(848,928,128,128) 资料文件夹+学长手
040 icon(992,928,128,128) 标注笔记本
041 icon(1136,928,128,128) 课桌纸条
042 icon(1280,928,128,128) 发光脑袋+平面图
043 icon(416,1072,128,128) 古书+夜灯
044 icon(560,1072,128,128) AI分析图+调色板
045 icon(704,1072,128,128) AI补剖面图
046 icon(848,1072,128,128) AI拼合团队图
047 icon(992,1072,128,128) AI抽象图+灯泡
048 icon(1136,1072,128,128) 多版AI立面
049 icon(1280,1072,128,128) 学弟点赞+AI芯片
050 icon(416,1216,128,128) 小灶讲台+计时钟
```

```text
# UIATLAS_019 | 模块：普通随机事件图标 03 | 2048x2048 | 43 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 长消息手机+学长信
002 icon(560,208,128,128) PVC板+递出手
003 icon(704,208,128,128) 整理线稿+小扫帚
004 icon(848,208,128,128) 对路案例书+星光
005 icon(992,208,128,128) 窗边座位+星光
006 icon(1136,208,128,128) 晚风窗帘+月亮
007 icon(1280,208,128,128) 被记住方案牌
008 icon(416,352,128,128) 学弟取图+打印纸
009 icon(560,352,128,128) 顺手画笔+流畅线
010 icon(704,352,128,128) 灰色色卡+星光
011 icon(848,352,128,128) 节点详图+灯泡
012 icon(992,352,128,128) 老师红笔+灯泡
013 icon(1136,352,128,128) 小红点消息
014 icon(1280,352,128,128) 旧模型+救生圈
015 icon(416,496,128,128) 完好打印图纸
016 icon(560,496,128,128) 珍藏书+递出手
017 icon(704,496,128,128) 方案名牌+记忆星
018 icon(848,496,128,128) 截止日便签+提醒铃
019 icon(992,496,128,128) 稳定线稿+直尺
020 icon(1136,496,128,128) 建院走廊晚霞
021 icon(1280,496,128,128) 专教日出+图桌
022 icon(416,640,128,128) 角落建筑书
023 icon(560,640,128,128) 废料板+星光
024 icon(704,640,128,128) 豆浆油条+晨光
025 icon(848,640,128,128) 好兄弟改图+绿勾
026 icon(992,640,128,128) 保存备注便签
027 icon(1136,640,128,128) 宿舍床+安睡月亮
028 icon(1280,640,128,128) 点名册+援手
029 icon(416,784,128,128) 微笑学生+红笔批注
030 icon(560,784,128,128) 生日蛋糕+音符
031 icon(704,784,128,128) 旧耳机+回忆时钟
032 icon(848,784,128,128) 倔强音符+逆风旗
033 icon(992,784,128,128) PVC板+礼物光
034 icon(1136,784,128,128) 密斯椅+梦泡
035 icon(1280,784,128,128) 旧草图本
036 icon(416,928,128,128) 军训合照
037 icon(560,928,128,128) 手绘明信片
038 icon(704,928,128,128) 工位自拍手机
039 icon(848,928,128,128) 成长树+导师红笔
040 icon(992,928,128,128) 旧便签+作品集
041 icon(1136,928,128,128) 空台球桌+落日
042 icon(1280,928,128,128) 设计课合照
043 icon(416,1072,128,128) 优秀作业栏
```

```text
# UIATLAS_020 | 模块：交互事件图标 | 2048x2048 | 49 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 裂开心形+建筑书
002 icon(560,208,128,128) 心动气泡+建院门口
003 icon(704,208,128,128) 借尺子+心形
004 icon(848,208,128,128) 红包+群聊
005 icon(992,208,128,128) 蓝屏电脑
006 icon(1136,208,128,128) AI生成图+手指选择
007 icon(1280,208,128,128) AI手绘草图
008 icon(416,352,128,128) 打印店偶遇+纸卷
009 icon(560,352,128,128) 借出的笔
010 icon(704,352,128,128) 双人看展板
011 icon(848,352,128,128) 深夜路灯+双人影
012 icon(992,352,128,128) 咖啡杯+心形便签
013 icon(1136,352,128,128) 讲座座位+保留牌
014 icon(1280,352,128,128) 双人看方案图
015 icon(416,496,128,128) 雨伞+双人影
016 icon(560,496,128,128) 夜宵摊+双人影
017 icon(704,496,128,128) 聚会餐桌+旧友
018 icon(848,496,128,128) 破解插件+警示三角
019 icon(992,496,128,128) 夜宵外卖盒
020 icon(1136,496,128,128) 软件更新齿轮
021 icon(1280,496,128,128) 美院展览票+画框
022 icon(416,640,128,128) 激光切割机+冲突闪电
023 icon(560,640,128,128) 求助同学+图纸
024 icon(704,640,128,128) 偏移轴线+红叉
025 icon(848,640,128,128) 被占座位+书包
026 icon(992,640,128,128) 清灰风扇+刷子
027 icon(1136,640,128,128) 摆烂队友+断裂图纸
028 icon(1280,640,128,128) 咖啡洒图纸
029 icon(416,784,128,128) 查寝门牌+外卖盒
030 icon(560,784,128,128) 二手模型+价签
031 icon(704,784,128,128) 学妹方案+指导手
032 icon(848,784,128,128) 分享会讲台+学长
033 icon(992,784,128,128) 雨水打湿图纸
034 icon(1136,784,128,128) 呼噜气泡+床铺
035 icon(1280,784,128,128) 逃课床铺+课表
036 icon(416,928,128,128) 模型猫脚印
037 icon(560,928,128,128) 重画红笔+废稿
038 icon(704,928,128,128) Rhino曲面+学妹头像
039 icon(848,928,128,128) 通过好友气泡
040 icon(992,928,128,128) 耳机+唱片选择
041 icon(1136,928,128,128) 台球杆+球桌
042 icon(1280,928,128,128) 手机游戏+五杀
043 icon(416,1072,128,128) 合唱麦克风+谱架
044 icon(560,1072,128,128) 剧本卡+面具
045 icon(704,1072,128,128) 电影票+银幕
046 icon(848,1072,128,128) 演唱会票+舞台灯
047 icon(992,1072,128,128) 羽毛球拍
048 icon(1136,1072,128,128) 跑鞋+操场
049 icon(1280,1072,128,128) 自行车+风线
```

```text
# UIATLAS_021 | 模块：模型周事件图标 | 2048x2048 | 12 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 模型材料包裹+绿勾
002 icon(560,208,128,128) 切歪模型+话术气泡
003 icon(704,208,128,128) 直切刀痕+模型板
004 icon(848,208,128,128) 递出模型板
005 icon(992,208,128,128) 模型+鼓励星
006 icon(1136,208,128,128) 老师点头+模型
007 icon(1280,208,128,128) 502胶水+粘住手指
008 icon(416,352,128,128) 贵价模型板+裂痕
009 icon(560,352,128,128) 空材料盒+缺货牌
010 icon(704,352,128,128) 比例尺错误+模型板
011 icon(848,352,128,128) 美工刀+创可贴
012 icon(992,352,128,128) 门框碰碎模型
```

```text
# UIATLAS_022 | 模块：事件弹窗与徽章状态 | 2048x2048 | 30 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，默认画成单独的 UI 图标内容，不额外画方框、按钮底板或外框；只有清单、卡片、徽章、锁槽、装备槽、弹窗卡等主体本身需要承载形状时才画框。黑白灰为主，少量低饱和辅助色；只在状态重点使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占96-118px，单图标通常1个主元素，必要时2个；关键处少量低饱和或高亮色点缀。禁止文字、数字、水印、抗锯齿、柔边、写实3D，可少量参考/复刻官方游戏像素质感。
001 icon(416,208,128,128) 钉住的事件卡
002 icon(560,208,128,128) 未知事件卡+旋转星
003 icon(704,208,128,128) 分岔选项卡
004 icon(848,208,128,128) 成绩单
005 icon(992,208,128,128) 讲台+红笔
006 icon(1136,208,128,128) 展板
007 icon(1280,208,128,128) 合同
008 icon(416,352,128,128) 沙漏+邮箱
009 icon(560,352,128,128) 红色警报牌
010 icon(704,352,128,128) 金色奖章
011 icon(848,352,128,128) 发光门+分岔路牌
012 icon(992,352,128,128) 唱片
013 icon(1136,352,128,128) 文件夹
014 icon(1280,352,128,128) 邮箱+信封
015 icon(416,496,128,128) 红黑契约
016 icon(560,496,128,128) 厚重对话框
017 icon(704,496,128,128) 小气泡+灯泡
018 icon(848,496,128,128) 铃铛
019 icon(992,496,128,128) 木质小徽章
020 icon(1136,496,128,128) 蓝色宝石徽章
021 icon(1280,496,128,128) 紫色水晶徽章
022 icon(416,640,128,128) 金色皇冠徽章
023 icon(560,640,128,128) 打开的锁
024 icon(704,640,128,128) 灰色锁+暗色相框
025 icon(848,640,128,128) 第一次星章
026 icon(992,640,128,128) 循环箭头
027 icon(1136,640,128,128) 红色新内容小旗
028 icon(1280,640,128,128) 装备槽+绿色勾
029 icon(416,784,128,128) 空装备槽
030 icon(560,784,128,128) 空货架
```

```text
# UIATLAS_023 | 模块：专辑圆形 UI 图标 | 2048x2048 | 46 UI icons
生成 2048x2048 透明 PNG 像素 UI 图集。每行最多7个、最多50个槽位，槽位步进144x144，每个绘制框128x128，从(416,208)开始；只在下方 icon(x,y,128,128) 框内绘制，未列出的格子完全透明。风格：我的世界方块像素风，专辑圆形 UI 图标必须保持圆形唱片轮廓，不额外画方框、按钮底板或外框；黑白灰为主，少量低饱和辅助色；状态重点才使用绿色、红色、蓝色、金色高亮。硬边像素，深色粗描边，左上高光、右下轻阴影，主体居中占104-120px，中心图案通常1个主意象，必要时1个小点缀；禁止文字、数字、水印、抗锯齿、柔边、写实3D。
001 icon(416,208,128,128) 静谧的圆形像素草地方块唱片
002 icon(560,208,128,128) 神秘的圆形像素石门遗迹唱片
003 icon(704,208,128,128) 温柔的圆形像素黄昏流星唱片
004 icon(848,208,128,128) 怀旧的圆形像素记忆相片唱片
005 icon(992,208,128,128) 明亮的圆形像素五月花唱片
006 icon(1136,208,128,128) 泛黄的圆形像素旧相册唱片
007 icon(1280,208,128,128) 清澈的圆形像素蓝色音符唱片
008 icon(416,352,128,128) 安静的圆形像素知足脚印唱片
009 icon(560,352,128,128) 晴朗的圆形像素草地太阳唱片
010 icon(704,352,128,128) 温暖的圆形像素小屋灯光唱片
011 icon(848,352,128,128) 清凉的圆形像素海湾贝壳唱片
012 icon(992,352,128,128) 甜蜜的圆形像素糖果爱心唱片
013 icon(1136,352,128,128) 热闹的圆形像素宠物围栏唱片
014 icon(1280,352,128,128) 寂静的圆形像素雪人松树唱片
015 icon(416,496,128,128) 轻柔的圆形像素雪花爱心唱片
016 icon(560,496,128,128) 灿烂的圆形像素夏日冰棒唱片
017 icon(704,496,128,128) 闪耀的圆形像素星空茶杯唱片
018 icon(848,496,128,128) 冒险的圆形像素红白圆球唱片
019 icon(992,496,128,128) 宁静的圆形像素白墙村屋唱片
020 icon(1136,496,128,128) 胜利的圆形像素剑盾徽章唱片
021 icon(1280,496,128,128) 柔和的圆形像素钢琴爱心唱片
022 icon(416,640,128,128) 温柔的圆形像素月亮微光唱片
023 icon(560,640,128,128) 清亮的圆形像素舞台麦克风唱片
024 icon(704,640,128,128) 怀旧的圆形像素时钟唱片
025 icon(848,640,128,128) 潮湿的圆形像素雨夜背影唱片
026 icon(992,640,128,128) 晴朗的圆形像素云朵天空唱片
027 icon(1136,640,128,128) 青春的圆形像素时光机唱片
028 icon(1280,640,128,128) 离别的圆形像素钢琴键盘唱片
029 icon(416,784,128,128) 温暖的圆形像素回归线爱心唱片
030 icon(560,784,128,128) 孤独的圆形像素纸船海面唱片
031 icon(704,784,128,128) 怀旧的圆形像素旧操场吉他唱片
032 icon(848,784,128,128) 辽阔的圆形像素蓝海毕业身影唱片
033 icon(992,784,128,128) 温暖的圆形像素举杯灯光唱片
034 icon(1136,784,128,128) 闪亮的圆形像素主角光环唱片
035 icon(1280,784,128,128) 朝气的圆形像素朝阳少年唱片
036 icon(416,928,128,128) 炽热的圆形像素夏日校园唱片
037 icon(560,928,128,128) 明亮的圆形像素星光舞台唱片
038 icon(704,928,128,128) 怀旧的圆形像素毕业黑板唱片
039 icon(848,928,128,128) 安静的圆形像素城市夜景唱片
040 icon(992,928,128,128) 沉重的圆形像素延毕红章唱片
041 icon(1136,928,128,128) 干瘪的圆形像素空钱包唱片
042 icon(1280,928,128,128) 孤独的圆形像素流浪小提琴唱片
043 icon(416,1072,128,128) 灰暗的圆形像素退学信唱片
044 icon(560,1072,128,128) 萧瑟的圆形像素风中街道唱片
045 icon(704,1072,128,128) 温暖的圆形像素拉勾红线唱片
046 icon(848,1072,128,128) 清新的圆形像素蒲公英约定唱片
```
