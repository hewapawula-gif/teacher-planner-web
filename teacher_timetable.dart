import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const TeacherApp());
}

// ─── Data model ──────────────────────────────────────────────────────────────

enum PeriodType { regular, current, off, relief }

class Period {
  final int number;
  final String subject;
  final String className;
  final PeriodType type;
  final TimeOfDay startTime;
  final TimeOfDay endTime;

  const Period({
    required this.number,
    required this.subject,
    required this.className,
    required this.type,
    required this.startTime,
    required this.endTime,
  });

  Period copyWith({PeriodType? type}) => Period(
        number: number,
        subject: subject,
        className: className,
        type: type ?? this.type,
        startTime: startTime,
        endTime: endTime,
      );
}

final List<Period> kPeriods = [
  Period(number: 1, subject: 'Mathematics', className: '10C', type: PeriodType.regular, startTime: const TimeOfDay(hour: 7,  minute: 30), endTime: const TimeOfDay(hour: 8,  minute: 15)),
  Period(number: 2, subject: 'Mathematics', className: '11B', type: PeriodType.regular, startTime: const TimeOfDay(hour: 8,  minute: 15), endTime: const TimeOfDay(hour: 9,  minute: 0)),
  Period(number: 3, subject: 'Mathematics', className: '6A',  type: PeriodType.regular, startTime: const TimeOfDay(hour: 9,  minute: 0),  endTime: const TimeOfDay(hour: 9,  minute: 45)),
  Period(number: 4, subject: 'Mathematics', className: '8B',  type: PeriodType.regular, startTime: const TimeOfDay(hour: 9,  minute: 45), endTime: const TimeOfDay(hour: 10, minute: 30)),
  Period(number: 5, subject: 'Off Period',  className: '—',   type: PeriodType.off,     startTime: const TimeOfDay(hour: 10, minute: 30), endTime: const TimeOfDay(hour: 11, minute: 15)),
  Period(number: 6, subject: 'Mathematics', className: '8C',  type: PeriodType.regular, startTime: const TimeOfDay(hour: 11, minute: 15), endTime: const TimeOfDay(hour: 12, minute: 0)),
  Period(number: 7, subject: 'Relief',      className: '10AB',type: PeriodType.relief,  startTime: const TimeOfDay(hour: 13, minute: 0),  endTime: const TimeOfDay(hour: 13, minute: 45)),
  Period(number: 8, subject: 'Mathematics', className: '6B',  type: PeriodType.regular, startTime: const TimeOfDay(hour: 13, minute: 45), endTime: const TimeOfDay(hour: 14, minute: 30)),
];

// ─── Colors ───────────────────────────────────────────────────────────────────

class PeriodColors {
  final Color background;
  final Color border;
  final Color text;
  final Color badge;
  final Color badgeText;

  const PeriodColors({
    required this.background,
    required this.border,
    required this.text,
    required this.badge,
    required this.badgeText,
  });
}

PeriodColors periodColors(PeriodType type) {
  switch (type) {
    case PeriodType.current:
      return const PeriodColors(
        background: Color(0xFFEF4444),
        border:     Color(0xFFDC2626),
        text:       Colors.white,
        badge:      Color(0x44FFFFFF),
        badgeText:  Colors.white,
      );
    case PeriodType.off:
      return const PeriodColors(
        background: Color(0xFFFEF08A),
        border:     Color(0xFFFDE047),
        text:       Color(0xFF713F12),
        badge:      Color(0xFFCA8A04),
        badgeText:  Colors.white,
      );
    case PeriodType.relief:
      return const PeriodColors(
        background: Color(0xFF4ADE80),
        border:     Color(0xFF22C55E),
        text:       Colors.white,
        badge:      Color(0x44FFFFFF),
        badgeText:  Colors.white,
      );
    case PeriodType.regular:
    default:
      return const PeriodColors(
        background: Color(0xFFE0E7FF),
        border:     Color(0xFFC7D2FE),
        text:       Color(0xFF1E1B4B),
        badge:      Color(0xFFA5B4FC),
        badgeText:  Color(0xFF1E1B4B),
      );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

int _toMinutes(TimeOfDay t) => t.hour * 60 + t.minute;

int currentPeriodIndex(DateTime now) {
  final mins = now.hour * 60 + now.minute;
  for (int i = 0; i < kPeriods.length; i++) {
    final s = _toMinutes(kPeriods[i].startTime);
    final e = _toMinutes(kPeriods[i].endTime);
    if (mins >= s && mins < e) return i;
  }
  return -1;
}

String formatTimeOfDay(TimeOfDay t) {
  final h = t.hour.toString().padLeft(2, '0');
  final m = t.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

String formatDateTime(DateTime dt) {
  final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  final months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  final day = days[dt.weekday - 1];
  return '$day, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
}

String formatNowTime(DateTime dt) {
  final h = dt.hour.toString().padLeft(2, '0');
  final m = dt.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

// ─── App root ─────────────────────────────────────────────────────────────────

class TeacherApp extends StatelessWidget {
  const TeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Teacher Timetable',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Nunito',
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3B5BDB)),
        useMaterial3: true,
      ),
      home: const TimetablePage(),
    );
  }
}

// ─── Timetable page ──────────────────────────────────────────────────────────

class TimetablePage extends StatefulWidget {
  const TimetablePage({super.key});

  @override
  State<TimetablePage> createState() => _TimetablePageState();
}

class _TimetablePageState extends State<TimetablePage> {
  late DateTime _now;
  late Timer _timer;
  int _navIndex = 0;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  List<Period> get _periods {
    final activeIdx = currentPeriodIndex(_now);
    // If no period matches clock, show period 4 (index 3) as demo current
    final demoIdx = activeIdx >= 0 ? activeIdx : 3;
    return List.generate(kPeriods.length, (i) {
      final p = kPeriods[i];
      if (i == demoIdx && p.type == PeriodType.regular) {
        return p.copyWith(type: PeriodType.current);
      }
      return p;
    });
  }

  int get _activePeriodIdx {
    final active = currentPeriodIndex(_now);
    return active >= 0 ? active : 3;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF3B5BDB), Color(0xFF4C6EF5), Color(0xFF364FC7)],
            stops: [0.0, 0.4, 1.0],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildLegend(),
              const SizedBox(height: 8),
              Expanded(child: _buildPeriodList()),
              _buildBottomNav(),
            ],
          ),
        ),
      ),
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  formatDateTime(_now).split(',').first.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'My Timetable',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatDateTime(_now).contains(',')
                      ? formatDateTime(_now).substring(formatDateTime(_now).indexOf(',') + 2)
                      : formatDateTime(_now),
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          // Avatar
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.2),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: const Center(
              child: Text(
                'T',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Legend ────────────────────────────────────────────────────────────────

  Widget _buildLegend() {
    final items = [
      ('Current', const Color(0xFFEF4444)),
      ('Off Period', const Color(0xFFFEF08A)),
      ('Relief', const Color(0xFF4ADE80)),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
      child: Row(
        children: items
            .map(
              (item) => Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: item.$2,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      item.$1,
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  // ── Period list with timeline ─────────────────────────────────────────────

  Widget _buildPeriodList() {
    final periods = _periods;
    final activeIdx = _activePeriodIdx;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Period cards
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.only(bottom: 8),
              itemCount: periods.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => PeriodCard(
                period: periods[i],
                isActive: i == activeIdx,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Timeline
          SizedBox(
            width: 36,
            child: TimetableTimeline(
              currentTime: formatNowTime(_now),
              activePeriodIdx: activeIdx,
              totalPeriods: periods.length,
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom nav ────────────────────────────────────────────────────────────

  Widget _buildBottomNav() {
    final items = [
      (Icons.home_rounded, 'Home'),
      (Icons.calendar_month_rounded, 'Schedule'),
      (Icons.groups_rounded, 'Classes'),
      (Icons.person_rounded, 'Profile'),
    ];
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF3B5BDB).withOpacity(0.6),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
      ),
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (i) {
          final active = i == _navIndex;
          return GestureDetector(
            onTap: () => setState(() => _navIndex = i),
            behavior: HitTestBehavior.opaque,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  items[i].$1,
                  color: active ? Colors.white : Colors.white38,
                  size: 24,
                ),
                const SizedBox(height: 3),
                Text(
                  items[i].$2,
                  style: TextStyle(
                    color: active ? Colors.white : Colors.white38,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (active) ...[
                  const SizedBox(height: 3),
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ─── Period card widget ───────────────────────────────────────────────────────

class PeriodCard extends StatelessWidget {
  final Period period;
  final bool isActive;

  const PeriodCard({super.key, required this.period, required this.isActive});

  @override
  Widget build(BuildContext context) {
    final colors = periodColors(period.type);
    final isOff = period.type == PeriodType.off;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border, width: 1.5),
        boxShadow: isActive
            ? [BoxShadow(color: const Color(0xFFEF4444).withOpacity(0.35), blurRadius: 12, offset: const Offset(0, 4))]
            : [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            // Period number circle
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _numberCircleColor(period.type),
              ),
              child: Center(
                child: Text(
                  '${period.number}',
                  style: TextStyle(
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Subject & time
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isOff ? 'Off Period' : period.subject,
                    style: TextStyle(
                      color: colors.text,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${formatTimeOfDay(period.startTime)} – ${formatTimeOfDay(period.endTime)}',
                    style: TextStyle(
                      color: colors.text.withOpacity(0.6),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            // Class badge + type label
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!isOff)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.badge,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      period.className,
                      style: TextStyle(
                        color: colors.badgeText,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                if (period.type != PeriodType.regular) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _typeLabelColor(period.type),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _typeLabel(period.type),
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _numberCircleColor(PeriodType type) {
    switch (type) {
      case PeriodType.current: return Colors.white.withOpacity(0.25);
      case PeriodType.off:     return const Color(0xFFFBBF24).withOpacity(0.5);
      case PeriodType.relief:  return Colors.white.withOpacity(0.25);
      case PeriodType.regular: return const Color(0xFFA5B4FC).withOpacity(0.6);
    }
  }

  Color _typeLabelColor(PeriodType type) {
    switch (type) {
      case PeriodType.current: return Colors.white.withOpacity(0.2);
      case PeriodType.off:     return const Color(0xFFFBBF24).withOpacity(0.5);
      case PeriodType.relief:  return Colors.white.withOpacity(0.2);
      default:                 return Colors.transparent;
    }
  }

  String _typeLabel(PeriodType type) {
    switch (type) {
      case PeriodType.current: return 'NOW';
      case PeriodType.off:     return 'OFF';
      case PeriodType.relief:  return 'RELIEF';
      default:                 return '';
    }
  }
}

// ─── Timeline widget ──────────────────────────────────────────────────────────

class TimetableTimeline extends StatelessWidget {
  final String currentTime;
  final int activePeriodIdx;
  final int totalPeriods;

  const TimetableTimeline({
    super.key,
    required this.currentTime,
    required this.activePeriodIdx,
    required this.totalPeriods,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalHeight = constraints.maxHeight;
        // Each period row is approximately equal height
        final rowHeight = totalHeight / totalPeriods;
        // Marker sits at the center of the active row
        final markerTop = (activePeriodIdx * rowHeight) + (rowHeight * 0.5);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            // Vertical line
            Positioned(
              left: 17,
              top: 0,
              bottom: 0,
              child: Container(
                width: 2,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),

            // Tick marks for each period
            ...List.generate(totalPeriods, (i) {
              final tickTop = (i * rowHeight) + (rowHeight * 0.5);
              return Positioned(
                left: 12,
                top: tickTop - 1,
                child: Container(
                  width: 10,
                  height: 2,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              );
            }),

            // Current marker: arrow + dot
            Positioned(
              left: 0,
              top: markerTop - 6,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Left-pointing triangle arrow
                  CustomPaint(
                    size: const Size(8, 12),
                    painter: _ArrowPainter(),
                  ),
                  // Short horizontal line
                  Container(width: 4, height: 2, color: const Color(0xFFEF4444)),
                  // Circle dot
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFEF4444),
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEF4444).withOpacity(0.5),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Time label — floats to the left of the timeline
            Positioned(
              right: 0,
              top: markerTop - 11,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.85),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withOpacity(0.3),
                      blurRadius: 6,
                    ),
                  ],
                ),
                child: Text(
                  currentTime,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFFEF4444);
    final path = Path()
      ..moveTo(size.width, 0)
      ..lineTo(0, size.height / 2)
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_ArrowPainter oldDelegate) => false;
}
