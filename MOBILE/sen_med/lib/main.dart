import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const SenMedApp());
}

// ══════════════════════════════════════════════════════════
// PALETTE DE COULEURS — identique au thème web SEN-MED
// ══════════════════════════════════════════════════════════
class AppColors {
  static const Color primary      = Color(0xFF002F59); // bleu principal
  static const Color primaryLight = Color(0xFF003F7A); // bleu clair
  static const Color primaryMuted = Color(0xFF4A6FA5); // bleu atténué
  static const Color accent       = Color(0xFFFF7631); // orange vif
  static const Color accentDark   = Color(0xFFE0621F); // orange foncé
  static const Color white        = Color(0xFFFFFFFF);
  static const Color gray50       = Color(0xFFF8F9FA);
  static const Color gray100      = Color(0xFFF1F3F5);
  static const Color gray200      = Color(0xFFE9ECEF);
  static const Color gray400      = Color(0xFFCED4DA);
  static const Color gray500      = Color(0xFFADB5BD);
  static const Color gray700      = Color(0xFF495057);
  static const Color gray900      = Color(0xFF212529);
  static const Color success      = Color(0xFF28A745);
  static const Color warning      = Color(0xFFFFC107);
  static const Color danger       = Color(0xFFDC3545);
  static const Color info         = Color(0xFF1565C0);
}

// ══════════════════════════════════════════════════════════
// APPLICATION ROOT
// ══════════════════════════════════════════════════════════
class SenMedApp extends StatelessWidget {
  const SenMedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SEN-MED',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.white,
        ),
        scaffoldBackgroundColor: AppColors.gray100,
      ),
      home: const MainScreen(),
    );
  }
}

// ══════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL — Navigation par onglets
// ══════════════════════════════════════════════════════════
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  static const List<_NavItem> _navItems = [
    _NavItem(icon: Icons.dashboard_outlined,     activeIcon: Icons.dashboard_rounded,      label: 'Accueil'),
    _NavItem(icon: Icons.people_outline_rounded, activeIcon: Icons.people_rounded,          label: 'Personnel'),
    _NavItem(icon: Icons.calendar_month_outlined, activeIcon: Icons.calendar_month_rounded, label: 'Planning'),
    _NavItem(icon: Icons.handshake_outlined,     activeIcon: Icons.handshake_rounded,       label: 'Partenaires'),
    _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded,          label: 'Profil'),
  ];

  static const List<Widget> _screens = [
    DashboardScreen(),
    PersonnelScreen(),
    PlanningScreen(),
    PartenaireScreen(),
    ProfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _screens),
      bottomNavigationBar: _BottomNavBar(
        items: _navItems,
        selectedIndex: _selectedIndex,
        onTap: (i) => setState(() => _selectedIndex = i),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}

// ══════════════════════════════════════════════════════════
// BARRE DE NAVIGATION PERSONNALISÉE
// ══════════════════════════════════════════════════════════
class _BottomNavBar extends StatelessWidget {
  final List<_NavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onTap;

  const _BottomNavBar({
    required this.items,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        border: const Border(top: BorderSide(color: AppColors.gray200, width: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: List.generate(items.length, (i) {
              final item = items[i];
              final isActive = i == selectedIndex;
              return Expanded(
                child: _NavBarButton(
                  icon: isActive ? item.activeIcon : item.icon,
                  label: item.label,
                  isActive: isActive,
                  onTap: () => onTap(i),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavBarButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavBarButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      splashColor: AppColors.primary.withValues(alpha: 0.08),
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Indicateur actif
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            width: isActive ? 36 : 0,
            height: 3,
            decoration: BoxDecoration(
              color: AppColors.accent,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 6),
          // Icône avec fond animé
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary.withValues(alpha: 0.08) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              icon,
              size: 22,
              color: isActive ? AppColors.primary : AppColors.gray500,
            ),
          ),
          const SizedBox(height: 2),
          // Label
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              color: isActive ? AppColors.primary : AppColors.gray500,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// APP BAR COMMUN SEN-MED
// ══════════════════════════════════════════════════════════
class SenMedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final List<Widget>? actions;
  final bool showLogo;

  const SenMedAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.actions,
    this.showLogo = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleSpacing: 16,
        title: Row(
          children: [
            if (showLogo) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'SEN',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
              ],
            ),
          ],
        ),
        actions: actions,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 64 : kToolbarHeight);
}

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray100,
      appBar: SenMedAppBar(
        title: 'MED',
        subtitle: 'Tableau de bord',
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: GestureDetector(
              onTap: () {},
              child: Container(
                width: 32, height: 32,
                decoration: const BoxDecoration(
                  color: AppColors.accent,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text(
                    'A',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bannière de bienvenue
            _WelcomeBanner(),
            const SizedBox(height: 22),

            // Statistiques
            const _SectionTitle(title: 'Vue d\'ensemble'),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.65,
              children: const [
                _StatCard(icon: Icons.people_rounded,   value: '124', label: 'Personnel',   color: AppColors.primary),
                _StatCard(icon: Icons.local_hospital,   value: '8',   label: 'Hôpitaux',    color: AppColors.info),
                _StatCard(icon: Icons.business_center,  value: '32',  label: 'Partenaires', color: AppColors.accent),
                _StatCard(icon: Icons.medical_services, value: '256', label: 'Services',    color: AppColors.success),
              ],
            ),
            const SizedBox(height: 22),

            // Accès rapides
            const _SectionTitle(title: 'Accès rapides'),
            const SizedBox(height: 12),
            const _QuickActionCard(
              icon: Icons.person_add_rounded,
              title: 'Ajouter du personnel',
              subtitle: 'Créer un nouveau dossier médical',
              color: AppColors.primary,
            ),
            const SizedBox(height: 10),
            const _QuickActionCard(
              icon: Icons.calendar_today_rounded,
              title: 'Gérer le planning',
              subtitle: 'Horaires et disponibilités médecins',
              color: AppColors.info,
            ),
            const SizedBox(height: 10),
            const _QuickActionCard(
              icon: Icons.handshake_rounded,
              title: 'Nouveau partenaire',
              subtitle: 'Assurances, mutuelles, entreprises',
              color: AppColors.accent,
            ),
            const SizedBox(height: 22),

            // Activité récente
            const _SectionTitle(title: 'Activité récente'),
            const SizedBox(height: 12),
            _RecentActivityCard(),
          ],
        ),
      ),
    );
  }
}

// ─── Bannière bienvenue ────────────────────────────────────
class _WelcomeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Bienvenue 👋', style: TextStyle(color: Colors.white60, fontSize: 13)),
                const SizedBox(height: 4),
                const Text(
                  'Administrateur',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.5)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, size: 7, color: AppColors.accent),
                      SizedBox(width: 6),
                      Text('Système actif', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 1.5),
            ),
            child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 32),
          ),
        ],
      ),
    );
  }
}

// ─── Titre de section ──────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4, height: 16,
          decoration: BoxDecoration(
            color: AppColors.accent,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.gray900,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }
}

// ─── Carte statistique ─────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 21),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color, height: 1)),
                const SizedBox(height: 3),
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray500, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Carte accès rapide ────────────────────────────────────
class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(14),
        splashColor: color.withValues(alpha: 0.06),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 23),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gray900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11.5, color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios_rounded, size: 13, color: color.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Activité récente ──────────────────────────────────────
class _RecentActivityCard extends StatelessWidget {
  final List<Map<String, dynamic>> items = const [
    {
      'icon': Icons.person_add_rounded,
      'title': 'Nouveau personnel ajouté',
      'subtitle': 'Dr. Amadou Diallo — Médecin',
      'time': 'il y a 2 min',
      'color': AppColors.primary,
    },
    {
      'icon': Icons.event_available_rounded,
      'title': 'Horaire mis à jour',
      'subtitle': 'Planning semaine 15 — Cardiologie',
      'time': 'il y a 1 h',
      'color': AppColors.info,
    },
    {
      'icon': Icons.handshake_rounded,
      'title': 'Partenaire activé',
      'subtitle': 'IPMG Assurances Sénégal',
      'time': 'il y a 3 h',
      'color': AppColors.accent,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final i = e.key;
          final item = e.value;
          final color = item['color'] as Color;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                child: Row(
                  children: [
                    Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(item['icon'] as IconData, color: color, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['title'] as String,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.gray900,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item['subtitle'] as String,
                            style: const TextStyle(fontSize: 11.5, color: AppColors.gray500),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      item['time'] as String,
                      style: const TextStyle(fontSize: 10.5, color: AppColors.gray400),
                    ),
                  ],
                ),
              ),
              if (i < items.length - 1)
                const Divider(height: 1, color: AppColors.gray100, indent: 64, endIndent: 14),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// ÉCRANS SECONDAIRES — Structure prête à développer
// ══════════════════════════════════════════════════════════
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _PlaceholderScreen({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.color = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray100,
      appBar: SenMedAppBar(title: title, subtitle: subtitle),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 38, color: color),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.gray900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Section en cours de développement',
              style: TextStyle(fontSize: 13, color: AppColors.gray500),
            ),
          ],
        ),
      ),
    );
  }
}

class PersonnelScreen extends StatelessWidget {
  const PersonnelScreen({super.key});
  @override
  Widget build(BuildContext context) => const _PlaceholderScreen(
    title: 'Personnel',
    subtitle: 'Gestion des équipes médicales',
    icon: Icons.people_rounded,
    color: AppColors.primary,
  );
}

class PlanningScreen extends StatelessWidget {
  const PlanningScreen({super.key});
  @override
  Widget build(BuildContext context) => const _PlaceholderScreen(
    title: 'Planning',
    subtitle: 'Horaires et disponibilités',
    icon: Icons.calendar_month_rounded,
    color: AppColors.info,
  );
}

class PartenaireScreen extends StatelessWidget {
  const PartenaireScreen({super.key});
  @override
  Widget build(BuildContext context) => const _PlaceholderScreen(
    title: 'Partenaires',
    subtitle: 'Assurances & mutuelles',
    icon: Icons.handshake_rounded,
    color: AppColors.accent,
  );
}

class ProfilScreen extends StatelessWidget {
  const ProfilScreen({super.key});
  @override
  Widget build(BuildContext context) => const _PlaceholderScreen(
    title: 'Profil',
    subtitle: 'Mon compte',
    icon: Icons.person_rounded,
    color: AppColors.primaryMuted,
  );
}
