import { CodeFile } from '../types';

export function create500LineXmlSample(): CodeFile {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<!-- Comprehensive Android Activity Layout with 500+ Lines -->');
  lines.push('<androidx.coordinatorlayout.widget.CoordinatorLayout');
  lines.push('    xmlns:android="http://schemas.android.com/apk/res/android"');
  lines.push('    xmlns:app="http://schemas.android.com/apk/res-auto"');
  lines.push('    xmlns:tools="http://schemas.android.com/tools"');
  lines.push('    android:id="@+id/coordinator_layout_root"');
  lines.push('    android:layout_width="match_parent"');
  lines.push('    android:layout_height="match_parent"');
  lines.push('    android:background="@color/surface_background"');
  lines.push('    tools:context=".ui.main.MainActivity">');
  lines.push('');
  lines.push('    <!-- Top Application Bar Section -->');
  lines.push('    <com.google.android.material.appbar.AppBarLayout');
  lines.push('        android:id="@+id/app_bar_layout"');
  lines.push('        android:layout_width="match_parent"');
  lines.push('        android:layout_height="wrap_content"');
  lines.push('        android:elevation="4dp"');
  lines.push('        android:theme="@style/Theme.SourcePdfConverter.AppBarOverlay">');
  lines.push('');
  lines.push('        <com.google.android.material.appbar.MaterialToolbar');
  lines.push('            android:id="@+id/toolbar_main"');
  lines.push('            android:layout_width="match_parent"');
  lines.push('            android:layout_height="?attr/actionBarSize"');
  lines.push('            android:background="?attr/colorPrimary"');
  lines.push('            app:popupTheme="@style/Theme.SourcePdfConverter.PopupOverlay"');
  lines.push('            app:title="@string/app_title_dashboard"');
  lines.push('            app:titleTextColor="@color/white" />');
  lines.push('');
  lines.push('    </com.google.android.material.appbar.AppBarLayout>');
  lines.push('');
  lines.push('    <!-- Primary Nested Scrollable Container -->');
  lines.push('    <androidx.core.widget.NestedScrollView');
  lines.push('        android:id="@+id/nested_scroll_view_content"');
  lines.push('        android:layout_width="match_parent"');
  lines.push('        android:layout_height="match_parent"');
  lines.push('        android:fillViewport="true"');
  lines.push('        app:layout_behavior="@string/appbar_scrolling_view_behavior">');
  lines.push('');
  lines.push('        <androidx.constraintlayout.widget.ConstraintLayout');
  lines.push('            android:id="@+id/constraint_container"');
  lines.push('            android:layout_width="match_parent"');
  lines.push('            android:layout_height="wrap_content"');
  lines.push('            android:padding="16dp">');
  lines.push('');

  // Generate realistic view components to reach 500+ lines
  const components = [
    { type: 'HeaderCard', label: 'Welcome Dashboard Header', desc: 'Displays user stats and synchronization state' },
    { type: 'MetricsGrid', label: 'Performance & KPI Metrics', desc: 'Daily throughput and memory utilization metrics' },
    { type: 'UserProfileSection', label: 'User Identity & Credentials', desc: 'Active session auth details and permissions' },
    { type: 'ConfigurationSection', label: 'App Settings & Preferences', desc: 'Paper size, font scales, orientation toggles' },
    { type: 'RecentExportsSection', label: 'Export History & Records', desc: 'List of recently converted source code PDFs' },
    { type: 'NetworkStatusSection', label: 'Cloud Sync & Offline Mode', desc: 'Monitors real-time connectivity and socket status' },
    { type: 'TelemetrySection', label: 'Diagnostics & Bug Reports', desc: 'Error stack trace capture and memory leak logs' },
    { type: 'SecuritySection', label: 'Encryption & Key Management', desc: 'Keystore hashes and SHA256 certificate validation' },
  ];

  let cardIndex = 1;
  for (const comp of components) {
    lines.push(`            <!-- ================================================================ -->`);
    lines.push(`            <!-- Section ${cardIndex}: ${comp.label} -->`);
    lines.push(`            <!-- ================================================================ -->`);
    lines.push(`            <com.google.android.material.card.MaterialCardView`);
    lines.push(`                android:id="@+id/card_section_${cardIndex}"`);
    lines.push(`                android:layout_width="match_parent"`);
    lines.push(`                android:layout_height="wrap_content"`);
    lines.push(`                android:layout_marginTop="16dp"`);
    lines.push(`                app:cardCornerRadius="12dp"`);
    lines.push(`                app:cardElevation="2dp"`);
    lines.push(`                app:strokeColor="@color/divider_subtle"`);
    lines.push(`                app:strokeWidth="1dp">`);
    lines.push('');
    lines.push(`                <LinearLayout`);
    lines.push(`                    android:layout_width="match_parent"`);
    lines.push(`                    android:layout_height="wrap_content"`);
    lines.push(`                    android:orientation="vertical"`);
    lines.push(`                    android:padding="16dp">`);
    lines.push('');
    lines.push(`                    <TextView`);
    lines.push(`                        android:id="@+id/tv_title_section_${cardIndex}"`);
    lines.push(`                        android:layout_width="match_parent"`);
    lines.push(`                        android:layout_height="wrap_content"`);
    lines.push(`                        android:text="${comp.label}"`);
    lines.push(`                        android:textColor="@color/text_primary"`);
    lines.push(`                        android:textSize="18sp"`);
    lines.push(`                        android:textStyle="bold" />`);
    lines.push('');
    lines.push(`                    <TextView`);
    lines.push(`                        android:id="@+id/tv_desc_section_${cardIndex}"`);
    lines.push(`                        android:layout_width="match_parent"`);
    lines.push(`                        android:layout_height="wrap_content"`);
    lines.push(`                        android:layout_marginTop="4dp"`);
    lines.push(`                        android:text="${comp.desc}"`);
    lines.push(`                        android:textColor="@color/text_secondary"`);
    lines.push(`                        android:textSize="14sp" />`);
    lines.push('');
    lines.push(`                    <View`);
    lines.push(`                        android:layout_width="match_parent"`);
    lines.push(`                        android:layout_height="1dp"`);
    lines.push(`                        android:layout_marginVertical="12dp"`);
    lines.push(`                        android:background="@color/divider_subtle" />`);
    lines.push('');

    for (let field = 1; field <= 4; field++) {
      lines.push(`                    <!-- Field ${field} for Section ${cardIndex} -->`);
      lines.push(`                    <com.google.android.material.textfield.TextInputLayout`);
      lines.push(`                        android:id="@+id/input_layout_sec${cardIndex}_f${field}"`);
      lines.push(`                        style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox"`);
      lines.push(`                        android:layout_width="match_parent"`);
      lines.push(`                        android:layout_height="wrap_content"`);
      lines.push(`                        android:layout_marginBottom="8dp"`);
      lines.push(`                        android:hint="Parameter #${field} for ${comp.label}">`);
      lines.push('');
      lines.push(`                        <com.google.android.material.textfield.TextInputEditText`);
      lines.push(`                            android:id="@+id/et_sec${cardIndex}_f${field}"`);
      lines.push(`                            android:layout_width="match_parent"`);
      lines.push(`                            android:layout_height="wrap_content"`);
      lines.push(`                            android:inputType="text"`);
      lines.push(`                            android:maxLines="1"`);
      lines.push(`                            android:textColor="@color/text_primary" />`);
      lines.push('');
      lines.push(`                    </com.google.android.material.textfield.TextInputLayout>`);
      lines.push('');
    }

    lines.push(`                    <LinearLayout`);
    lines.push(`                        android:layout_width="match_parent"`);
    lines.push(`                        android:layout_height="wrap_content"`);
    lines.push(`                        android:layout_marginTop="8dp"`);
    lines.push(`                        android:gravity="end"`);
    lines.push(`                        android:orientation="horizontal">`);
    lines.push('');
    lines.push(`                        <com.google.android.material.button.MaterialButton`);
    lines.push(`                            android:id="@+id/btn_reset_sec${cardIndex}"`);
    lines.push(`                            style="@style/Widget.MaterialComponents.Button.TextButton"`);
    lines.push(`                            android:layout_width="wrap_content"`);
    lines.push(`                            android:layout_height="wrap_content"`);
    lines.push(`                            android:text="Reset" />`);
    lines.push('');
    lines.push(`                        <com.google.android.material.button.MaterialButton`);
    lines.push(`                            android:id="@+id/btn_apply_sec${cardIndex}"`);
    lines.push(`                            android:layout_width="wrap_content"`);
    lines.push(`                            android:layout_height="wrap_content"`);
    lines.push(`                            android:layout_marginStart="8dp"`);
    lines.push(`                            android:text="Apply Changes" />`);
    lines.push('');
    lines.push(`                    </LinearLayout>`);
    lines.push('');
    lines.push(`                </LinearLayout>`);
    lines.push(`            </com.google.android.material.card.MaterialCardView>`);
    lines.push('');
    cardIndex++;
  }

  // Footer floating button
  lines.push('            <!-- Floating Action Button for Quick Conversion -->');
  lines.push('            <com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton');
  lines.push('                android:id="@+id/fab_export_pdf"');
  lines.push('                android:layout_width="wrap_content"');
  lines.push('                android:layout_height="wrap_content"');
  lines.push('                android:layout_margin="16dp"');
  lines.push('                android:text="Generate Multi-Page PDF"');
  lines.push('                app:icon="@drawable/ic_picture_as_pdf"');
  lines.push('                app:layout_constraintBottom_toBottomOf="parent"');
  lines.push('                app:layout_constraintEnd_toEndOf="parent" />');
  lines.push('');
  lines.push('        </androidx.constraintlayout.widget.ConstraintLayout>');
  lines.push('    </androidx.core.widget.NestedScrollView>');
  lines.push('');
  lines.push('</androidx.coordinatorlayout.widget.CoordinatorLayout>');

  // Ensure exact count is at least 500 lines for the user test
  while (lines.length < 505) {
    const extraNum = lines.length + 1;
    lines.push(`<!-- Diagnostic comment line #${extraNum}: Verified XML syntax node integrity -->`);
  }

  const content = lines.join('\n');
  return {
    id: 'sample-500-lines-xml',
    name: 'activity_main_500_lines.xml',
    path: 'app/src/main/res/layout/activity_main_500_lines.xml',
    extension: 'xml',
    language: 'XML',
    content,
    linesCount: lines.length,
    sizeBytes: content.length,
    selected: true,
  };
}

export function createKotlinSample(): CodeFile {
  const content = `package com.example.notesapp.ui.noteslist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.notesapp.domain.model.Note
import com.example.notesapp.domain.usecase.AddNoteUseCase
import com.example.notesapp.domain.usecase.DeleteNoteUseCase
import com.example.notesapp.domain.usecase.GetNotesUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel managing state for NotesListScreen.
 * Adheres strictly to MVVM + Clean Architecture principles.
 */
class NotesListViewModel(
    private val getNotesUseCase: GetNotesUseCase,
    private val addNoteUseCase: AddNoteUseCase,
    private val deleteNoteUseCase: DeleteNoteUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(NotesListState(isLoading = true))
    val state: StateFlow<NotesListState> = _state.asStateFlow()

    init {
        observeNotes()
    }

    private fun observeNotes() {
        viewModelScope.launch {
            getNotesUseCase()
                .catch { exception ->
                    _state.update {
                        it.copy(isLoading = false, errorMessage = exception.message)
                    }
                }
                .collect { notesList ->
                    _state.update {
                        it.copy(
                            notes = notesList,
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                }
        }
    }

    fun addNote(title: String, content: String) {
        viewModelScope.launch {
            try {
                addNoteUseCase(title, content)
            } catch (e: Exception) {
                _state.update { it.copy(errorMessage = e.message) }
            }
        }
    }

    fun deleteNote(note: Note) {
        viewModelScope.launch {
            try {
                deleteNoteUseCase(note)
            } catch (e: Exception) {
                _state.update { it.copy(errorMessage = e.message) }
            }
        }
    }
}
`;
  const lines = content.split('\n');
  return {
    id: 'sample-kotlin-viewmodel',
    name: 'NotesListViewModel.kt',
    path: 'app/src/main/java/com/example/notesapp/ui/NotesListViewModel.kt',
    extension: 'kt',
    language: 'Kotlin',
    content,
    linesCount: lines.length,
    sizeBytes: content.length,
    selected: true,
  };
}
